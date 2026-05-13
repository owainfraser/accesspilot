import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { BookOpen } from "lucide-react";

export interface AuditLogEntry {
  id: string;
  action: string;
  userId?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  } | null;
}

interface AuditTableProps {
  entries: AuditLogEntry[];
}

function actionBadgeClass(action: string): string {
  if (action.includes("approved") || action.includes("grant.created") || action.includes("connected")) {
    return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  }
  if (action.includes("denied") || action.includes("revoked") || action.includes("deleted")) {
    return "bg-red-500/20 text-red-400 border-red-500/30";
  }
  if (action.includes("created") || action.includes("updated")) {
    return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  }
  if (action.includes("expired")) {
    return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
  return "bg-gray-700/50 text-gray-400 border-gray-600";
}

function formatAction(action: string): string {
  return action
    .split(".")
    .map((part) =>
      part
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    )
    .join(" → ");
}

export function AuditTable({ entries }: AuditTableProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-gray-800 p-4 mb-4">
          <BookOpen className="h-8 w-8 text-gray-600" />
        </div>
        <p className="text-gray-400 font-medium">No audit events</p>
        <p className="text-gray-600 text-sm mt-1">
          All system activity will be recorded here
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Resource</TableHead>
          <TableHead>IP Address</TableHead>
          <TableHead>Timestamp</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              <Badge className={actionBadgeClass(entry.action)}>
                {formatAction(entry.action)}
              </Badge>
            </TableCell>
            <TableCell>
              {entry.user ? (
                <div>
                  <p className="text-sm text-gray-200">{entry.user.name}</p>
                  <p className="text-xs text-gray-500">{entry.user.email}</p>
                </div>
              ) : (
                <span className="text-gray-500 text-sm">
                  {entry.userId ? (
                    <span className="font-mono text-xs">{entry.userId}</span>
                  ) : (
                    "System"
                  )}
                </span>
              )}
            </TableCell>
            <TableCell>
              {entry.resourceType || entry.resourceId ? (
                <div>
                  {entry.resourceType && (
                    <p className="text-sm text-gray-300">
                      {entry.resourceType.replace("_", " ")}
                    </p>
                  )}
                  {entry.resourceId && (
                    <p className="text-xs text-gray-600 font-mono truncate max-w-[120px]">
                      {entry.resourceId}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-gray-600 text-sm">—</span>
              )}
            </TableCell>
            <TableCell>
              <span className="text-sm text-gray-400 font-mono">
                {entry.ipAddress || "—"}
              </span>
            </TableCell>
            <TableCell className="text-sm text-gray-400 whitespace-nowrap">
              {formatDate(entry.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
