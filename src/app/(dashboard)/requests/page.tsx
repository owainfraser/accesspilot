import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { RequestCard } from "@/components/requests/request-card";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "DENIED", label: "Denied" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REVOKED", label: "Revoked" },
];

interface RequestsPageProps {
  searchParams: { status?: string };
}

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) redirect("/sign-in");

  const statusFilter = searchParams.status;
  const whereClause =
    user.role === "REQUESTER"
      ? {
          organizationId: user.organizationId,
          requesterId: user.id,
          ...(statusFilter && statusFilter !== "ALL"
            ? { status: statusFilter as "PENDING" | "APPROVED" | "DENIED" | "EXPIRED" | "REVOKED" }
            : {}),
        }
      : {
          organizationId: user.organizationId,
          ...(statusFilter && statusFilter !== "ALL"
            ? { status: statusFilter as "PENDING" | "APPROVED" | "DENIED" | "EXPIRED" | "REVOKED" }
            : {}),
        };

  const requests = await prisma.accessRequest.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { name: true, email: true } },
      policy: { select: { name: true, resourceType: true } },
    },
    take: 50,
  });

  const isApprover = user.role === "ADMIN" || user.role === "APPROVER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Access Requests</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {requests.length} request{requests.length !== 1 ? "s" : ""}{" "}
            {statusFilter && statusFilter !== "ALL"
              ? `with status ${statusFilter}`
              : "total"}
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
          <Link href="/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => {
          const isActive =
            (!statusFilter && opt.value === "ALL") ||
            statusFilter === opt.value;
          return (
            <Link
              key={opt.value}
              href={
                opt.value === "ALL"
                  ? "/requests"
                  : `/requests?status=${opt.value}`
              }
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-500 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      {/* Request list */}
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-gray-800 p-4 mb-4">
            <ClipboardList className="h-8 w-8 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">No requests found</p>
          <p className="text-gray-600 text-sm mt-1">
            {statusFilter
              ? `No requests with status ${statusFilter}`
              : "Submit your first access request to get started"}
          </p>
          <Button
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
            asChild
          >
            <Link href="/requests/new">
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              id={request.id}
              resourceName={request.resourceName}
              resourceType={
                request.policy.resourceType as
                  | "ENTRA_ROLE"
                  | "M365_GROUP"
                  | "AZURE_RESOURCE"
                  | "LOCAL_ADMIN"
              }
              requesterName={request.requester.name}
              requesterEmail={request.requester.email}
              status={
                request.status as
                  | "PENDING"
                  | "APPROVED"
                  | "DENIED"
                  | "EXPIRED"
                  | "REVOKED"
              }
              requestedDurationMinutes={request.requestedDurationMinutes}
              justification={request.justification}
              createdAt={request.createdAt}
              expiresAt={request.expiresAt}
              showApprovalActions={isApprover && request.status === "PENDING"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
