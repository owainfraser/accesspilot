import { auth } from "@clerk/nextjs";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { ApprovalPanel } from "@/components/requests/approval-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Shield,
  User,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  TimerOff,
  FileText,
} from "lucide-react";
import { formatDate, formatDuration } from "@/lib/utils";

const statusConfig = {
  PENDING: {
    label: "Pending",
    icon: <AlertCircle className="h-4 w-4" />,
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  APPROVED: {
    label: "Approved",
    icon: <CheckCircle className="h-4 w-4" />,
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  DENIED: {
    label: "Denied",
    icon: <XCircle className="h-4 w-4" />,
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  EXPIRED: {
    label: "Expired",
    icon: <TimerOff className="h-4 w-4" />,
    className: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  },
  REVOKED: {
    label: "Revoked",
    icon: <XCircle className="h-4 w-4" />,
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

export default async function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const currentUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!currentUser) redirect("/sign-in");

  const request = await prisma.accessRequest.findUnique({
    where: {
      id: params.id,
      organizationId: currentUser.organizationId,
    },
    include: {
      requester: { select: { name: true, email: true, role: true } },
      approvedBy: { select: { name: true, email: true } },
      policy: true,
      grant: true,
      approvalSteps: {
        include: {
          approver: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) notFound();

  const canApprove =
    currentUser.role === "ADMIN" || currentUser.role === "APPROVER";
  const status = request.status as keyof typeof statusConfig;
  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          asChild
        >
          <Link href="/requests">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-100 truncate">
              {request.resourceName}
            </h1>
            <Badge
              className={`inline-flex items-center gap-1.5 ${config.className}`}
            >
              {config.icon}
              {config.label}
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            Request ID: <span className="font-mono">{request.id}</span>
          </p>
        </div>
      </div>

      {/* Main details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resource Info */}
        <Card className="border-gray-700/50 bg-gray-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              Resource
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-base font-semibold text-gray-100">
              {request.resourceName}
            </p>
            <p className="text-xs text-gray-500 font-mono">{request.resourceId}</p>
            <p className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1 inline-block">
              {request.policy.resourceType.replace("_", " ")}
            </p>
          </CardContent>
        </Card>

        {/* Requester Info */}
        <Card className="border-gray-700/50 bg-gray-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              Requester
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-base font-semibold text-gray-100">
              {request.requester.name}
            </p>
            <p className="text-sm text-gray-400">{request.requester.email}</p>
            <p className="text-xs text-gray-600">
              {request.requester.role.charAt(0) +
                request.requester.role.slice(1).toLowerCase()}
            </p>
          </CardContent>
        </Card>

        {/* Duration */}
        <Card className="border-gray-700/50 bg-gray-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-base font-semibold text-gray-100">
              {formatDuration(request.requestedDurationMinutes)}
            </p>
            <p className="text-xs text-gray-500">
              Policy: {request.policy.name}
            </p>
            <p className="text-xs text-gray-600">
              Max allowed:{" "}
              {formatDuration(request.policy.maxDurationMinutes)}
            </p>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="border-gray-700/50 bg-gray-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Requested</p>
              <p className="text-sm text-gray-200">
                {formatDate(request.createdAt)}
              </p>
            </div>
            {request.approvedAt && (
              <div>
                <p className="text-xs text-gray-500">
                  {request.status === "DENIED" ? "Denied" : "Approved"}
                </p>
                <p className="text-sm text-gray-200">
                  {formatDate(request.approvedAt)}
                </p>
              </div>
            )}
            {request.expiresAt && (
              <div>
                <p className="text-xs text-gray-500">Expires</p>
                <p className="text-sm text-gray-200">
                  {formatDate(request.expiresAt)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Justification */}
      {request.justification && (
        <Card className="border-gray-700/50 bg-gray-800/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              Business Justification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 leading-relaxed italic">
              &ldquo;{request.justification}&rdquo;
            </p>
          </CardContent>
        </Card>
      )}

      {/* Denial reason */}
      {request.denialReason && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-red-400 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Denial Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 leading-relaxed">
              {request.denialReason}
            </p>
            {request.approvedBy && (
              <p className="text-xs text-gray-600 mt-2">
                — {request.approvedBy.name} ({request.approvedBy.email})
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approval steps */}
      {request.approvalSteps.length > 0 && (
        <Card className="border-gray-700/50 bg-gray-800/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-400">
              Approval History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {request.approvalSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-start gap-3 rounded-lg bg-gray-800/50 p-3"
              >
                {step.status === "APPROVED" ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : step.status === "DENIED" ? (
                  <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-200">
                      {step.approver.name}
                    </p>
                    <span className="text-xs text-gray-500">
                      {step.decidedAt ? formatDate(step.decidedAt) : "Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{step.approver.email}</p>
                  {step.comment && (
                    <p className="text-sm text-gray-400 mt-1 italic">
                      &ldquo;{step.comment}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Approval actions — only for admins/approvers on pending requests */}
      {canApprove && <ApprovalPanel requestId={request.id} requestStatus={request.status} />}
    </div>
  );
}
