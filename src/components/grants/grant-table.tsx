"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RevokeButton } from "./revoke-button";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { Shield, Clock, AlertTriangle } from "lucide-react";

export interface Grant {
  id: string;
  requestId: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  grantedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  user?: {
    name: string;
    email: string;
  };
}

interface GrantTableProps {
  grants: Grant[];
  showRevokeButton?: boolean;
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    function update() {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diffMs = expiry.getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const diffMinutes = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const remainingMinutes = diffMinutes % 60;

      setIsExpiringSoon(diffMinutes < 60);

      if (diffHours > 0) {
        setTimeLeft(`${diffHours}h ${remainingMinutes}m`);
      } else {
        const diffSeconds = Math.floor((diffMs % 60000) / 1000);
        setTimeLeft(`${diffMinutes}m ${diffSeconds}s`);
      }
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span
      className={
        isExpiringSoon
          ? "flex items-center gap-1 text-amber-400 font-medium"
          : "text-gray-300"
      }
    >
      {isExpiringSoon && <AlertTriangle className="h-3 w-3" />}
      {timeLeft}
    </span>
  );
}

const resourceTypeLabels: Record<string, string> = {
  ENTRA_ROLE: "Entra Role",
  M365_GROUP: "M365 Group",
  AZURE_RESOURCE: "Azure Resource",
  LOCAL_ADMIN: "Local Admin",
};

export function GrantTable({ grants, showRevokeButton = true }: GrantTableProps) {
  if (grants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-gray-800 p-4 mb-4">
          <Shield className="h-8 w-8 text-gray-600" />
        </div>
        <p className="text-gray-400 font-medium">No active grants</p>
        <p className="text-gray-600 text-sm mt-1">
          Approved access requests will appear here
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Resource</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Granted</TableHead>
          <TableHead>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Time Remaining
            </span>
          </TableHead>
          <TableHead>Status</TableHead>
          {showRevokeButton && <TableHead className="w-[100px]">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {grants.map((grant) => (
          <TableRow key={grant.id}>
            <TableCell>
              <div>
                <p className="font-medium text-gray-100">{grant.resourceName}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5 truncate max-w-[160px]">
                  {grant.resourceId}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                <Shield className="h-3 w-3" />
                {resourceTypeLabels[grant.resourceType] || grant.resourceType}
              </span>
            </TableCell>
            <TableCell>
              {grant.user ? (
                <div>
                  <p className="text-sm text-gray-200">{grant.user.name}</p>
                  <p className="text-xs text-gray-500">{grant.user.email}</p>
                </div>
              ) : (
                <span className="text-gray-500 text-sm font-mono">{grant.userId}</span>
              )}
            </TableCell>
            <TableCell className="text-sm text-gray-400">
              {formatDate(grant.grantedAt)}
            </TableCell>
            <TableCell>
              {grant.status === "ACTIVE" ? (
                <CountdownTimer expiresAt={grant.expiresAt} />
              ) : (
                <span className="text-gray-500 text-sm">—</span>
              )}
            </TableCell>
            <TableCell>
              <Badge
                className={
                  grant.status === "ACTIVE"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : grant.status === "REVOKED"
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                }
              >
                {grant.status}
              </Badge>
            </TableCell>
            {showRevokeButton && (
              <TableCell>
                {grant.status === "ACTIVE" && (
                  <RevokeButton grantId={grant.id} resourceName={grant.resourceName} />
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
