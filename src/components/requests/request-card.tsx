import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  User,
  Shield,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  TimerOff,
} from "lucide-react";
import { formatRelativeTime, formatDuration } from "@/lib/utils";

export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "DENIED"
  | "EXPIRED"
  | "REVOKED";

export type ResourceType =
  | "ENTRA_ROLE"
  | "M365_GROUP"
  | "AZURE_RESOURCE"
  | "LOCAL_ADMIN";

interface RequestCardProps {
  id: string;
  resourceName: string;
  resourceType: ResourceType;
  requesterName: string;
  requesterEmail: string;
  status: RequestStatus;
  requestedDurationMinutes: number;
  justification?: string | null;
  createdAt: Date | string;
  expiresAt?: Date | string | null;
  showApprovalActions?: boolean;
}

const statusConfig: Record<
  RequestStatus,
  {
    label: string;
    icon: React.ReactNode;
    badgeClass: string;
  }
> = {
  PENDING: {
    label: "Pending",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    badgeClass:
      "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  APPROVED: {
    label: "Approved",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  DENIED: {
    label: "Denied",
    icon: <XCircle className="h-3.5 w-3.5" />,
    badgeClass: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  EXPIRED: {
    label: "Expired",
    icon: <TimerOff className="h-3.5 w-3.5" />,
    badgeClass: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  },
  REVOKED: {
    label: "Revoked",
    icon: <XCircle className="h-3.5 w-3.5" />,
    badgeClass: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

const resourceTypeLabels: Record<ResourceType, string> = {
  ENTRA_ROLE: "Entra Role",
  M365_GROUP: "M365 Group",
  AZURE_RESOURCE: "Azure Resource",
  LOCAL_ADMIN: "Local Admin",
};

export function RequestCard({
  id,
  resourceName,
  resourceType,
  requesterName,
  requesterEmail,
  status,
  requestedDurationMinutes,
  justification,
  createdAt,
  expiresAt,
  showApprovalActions = false,
}: RequestCardProps) {
  const config = statusConfig[status];

  return (
    <Card className="group hover:border-gray-600 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Resource & type */}
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                <Shield className="h-3 w-3" />
                {resourceTypeLabels[resourceType]}
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-100 truncate">
              {resourceName}
            </h3>

            {/* Requester */}
            <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-400">
              <User className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">
                {requesterName}
                <span className="text-gray-600 ml-1">({requesterEmail})</span>
              </span>
            </div>

            {/* Justification */}
            {justification && (
              <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                &ldquo;{justification}&rdquo;
              </p>
            )}

            {/* Meta row */}
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(createdAt)}
              </span>
              <span>
                Duration: {formatDuration(requestedDurationMinutes)}
              </span>
              {expiresAt && status === "APPROVED" && (
                <span className="text-amber-500">
                  Expires {formatRelativeTime(expiresAt)}
                </span>
              )}
            </div>
          </div>

          {/* Status badge + action */}
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.badgeClass}`}
            >
              {config.icon}
              {config.label}
            </span>

            {showApprovalActions && status === "PENDING" ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  asChild
                >
                  <Link href={`/requests/${id}`}>Deny</Link>
                </Button>
                <Button
                  size="sm"
                  className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                  asChild
                >
                  <Link href={`/requests/${id}`}>Approve</Link>
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-gray-500 hover:text-gray-200 group-hover:opacity-100"
                asChild
              >
                <Link href={`/requests/${id}`} className="flex items-center gap-1">
                  View
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
