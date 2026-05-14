import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AuditTable } from "@/components/audit/audit-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Filter } from "lucide-react";
import Link from "next/link";

const ACTION_FILTERS = [
  { value: "ALL", label: "All Events" },
  { value: "request", label: "Requests" },
  { value: "grant", label: "Grants" },
  { value: "policy", label: "Policies" },
  { value: "user", label: "Auth" },
  { value: "integration", label: "Integrations" },
];

interface AuditPageProps {
  searchParams: { action?: string; page?: string };
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) redirect("/sign-in");

  // Only admins can see all audit logs; requesters see only their own
  if (user.role === "REQUESTER") {
    redirect("/dashboard");
  }

  const actionFilter = searchParams.action;
  const page = parseInt(searchParams.page || "1", 10);
  const pageSize = 50;

  const where = {
    organizationId: user.organizationId,
    ...(actionFilter && actionFilter !== "ALL"
      ? { action: { startsWith: actionFilter } }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Audit Log</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {total.toLocaleString()} event{total !== 1 ? "s" : ""} recorded
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-500" />
        {ACTION_FILTERS.map((f) => {
          const isActive =
            (!actionFilter && f.value === "ALL") || actionFilter === f.value;
          return (
            <Link
              key={f.value}
              href={
                f.value === "ALL"
                  ? "/audit"
                  : `/audit?action=${f.value}`
              }
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-500 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <Card className="border-gray-700/50 bg-gray-800/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-gray-100 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-400" />
            Audit Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AuditTable
            entries={entries.map((e) => ({
              ...e,
              metadata: e.metadata as Record<string, unknown> | null,
              createdAt: e.createdAt.toISOString(),
              user: e.user,
            }))}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700/50">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/audit?${new URLSearchParams({
                      ...(actionFilter ? { action: actionFilter } : {}),
                      page: String(page - 1),
                    })}`}
                    className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all"
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/audit?${new URLSearchParams({
                      ...(actionFilter ? { action: actionFilter } : {}),
                      page: String(page + 1),
                    })}`}
                    className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-all"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
