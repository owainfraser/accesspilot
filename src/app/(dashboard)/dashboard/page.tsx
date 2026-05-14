import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RequestCard } from "@/components/requests/request-card";
import { AuditTable } from "@/components/audit/audit-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowRight, Clock } from "lucide-react";

async function getDashboardData(clerkUserId: string) {
  // Find the user in our DB
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: { organization: true },
  });

  if (!user) return null;

  const orgId = user.organizationId;

  const [pendingRequests, activeGrants, totalPolicies, recentAuditLogs, expiringGrants] =
    await Promise.all([
      prisma.accessRequest.count({
        where: { organizationId: orgId, status: "PENDING" },
      }),
      prisma.accessGrant.count({
        where: { organizationId: orgId, status: "ACTIVE" },
      }),
      prisma.accessPolicy.count({
        where: { organizationId: orgId, isActive: true },
      }),
      prisma.auditLog.findMany({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.accessGrant.count({
        where: {
          organizationId: orgId,
          status: "ACTIVE",
          expiresAt: {
            lte: new Date(Date.now() + 60 * 60 * 1000), // within 1 hour
            gte: new Date(),
          },
        },
      }),
    ]);

  // Pending requests that need the current user's approval
  const pendingForApproval = await prisma.accessRequest.findMany({
    where: {
      organizationId: orgId,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      requester: { select: { name: true, email: true } },
      policy: { select: { name: true, resourceType: true } },
    },
  });

  return {
    user,
    stats: { pendingRequests, activeGrants, totalPolicies, expiringGrants },
    pendingForApproval,
    recentAuditLogs,
  };
}

export default async function DashboardPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const data = await getDashboardData(userId);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-400">Setting up your account...</p>
          <p className="text-gray-600 text-sm mt-1">
            Your organization will be configured shortly.
          </p>
        </div>
      </div>
    );
  }

  const { user, stats, pendingForApproval, recentAuditLogs } = data;
  const isApprover = user.role === "ADMIN" || user.role === "APPROVER";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Welcome back, {user.name} — {user.organization.name}
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
          <Link href="/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending approvals */}
        {isApprover && (
          <Card className="border-gray-700/50 bg-gray-800/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base text-gray-100 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  Pending Approvals
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-200 h-7"
                  asChild
                >
                  <Link href="/requests?status=PENDING" className="flex items-center gap-1">
                    View all
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingForApproval.length === 0 ? (
                <p className="text-center py-8 text-gray-500 text-sm">
                  No pending approvals
                </p>
              ) : (
                pendingForApproval.map((request) => (
                  <RequestCard
                    key={request.id}
                    id={request.id}
                    resourceName={request.resourceName}
                    resourceType={request.policy.resourceType as "ENTRA_ROLE" | "M365_GROUP" | "AZURE_RESOURCE" | "LOCAL_ADMIN"}
                    requesterName={request.requester.name}
                    requesterEmail={request.requester.email}
                    status={request.status as "PENDING"}
                    requestedDurationMinutes={request.requestedDurationMinutes}
                    justification={request.justification}
                    createdAt={request.createdAt}
                    expiresAt={request.expiresAt}
                    showApprovalActions
                  />
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent audit events */}
        <Card className={`border-gray-700/50 bg-gray-800/30 ${!isApprover ? "lg:col-span-2" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-gray-100">
                Recent Audit Events
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-500 hover:text-gray-200 h-7"
                asChild
              >
                <Link href="/audit" className="flex items-center gap-1">
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AuditTable
              entries={recentAuditLogs.map((log) => ({
                ...log,
                metadata: log.metadata as Record<string, unknown> | null,
                createdAt: log.createdAt.toISOString(),
                user: log.user,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
