import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { GrantTable } from "@/components/grants/grant-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Clock } from "lucide-react";

export default async function GrantsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) redirect("/sign-in");

  const isAdmin = user.role === "ADMIN" || user.role === "APPROVER";

  const grants = await prisma.accessGrant.findMany({
    where: {
      organizationId: user.organizationId,
      ...(isAdmin ? {} : { userId: user.id }),
      status: "ACTIVE",
    },
    orderBy: { expiresAt: "asc" },
    include: {
      request: {
        include: {
          requester: { select: { name: true, email: true } },
        },
      },
    },
  });

  // Count expiring within the hour
  const expiringCount = grants.filter(
    (g) => new Date(g.expiresAt).getTime() - Date.now() < 60 * 60 * 1000
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Active Grants</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {grants.length} active grant{grants.length !== 1 ? "s" : ""}
            {expiringCount > 0 && (
              <span className="ml-2 text-amber-400">
                · {expiringCount} expiring soon
              </span>
            )}
          </p>
        </div>
      </div>

      {expiringCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            <strong>{expiringCount} grant{expiringCount !== 1 ? "s" : ""}</strong> will
            expire within the next hour and be automatically revoked.
          </p>
        </div>
      )}

      <Card className="border-gray-700/50 bg-gray-800/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-gray-100 flex items-center gap-2">
            <Key className="h-4 w-4 text-blue-400" />
            Active Access Grants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <GrantTable
            grants={grants.map((g) => ({
              id: g.id,
              requestId: g.requestId,
              userId: g.userId,
              resourceType: g.resourceType,
              resourceId: g.resourceId,
              resourceName: g.resourceName,
              grantedAt: g.grantedAt.toISOString(),
              expiresAt: g.expiresAt.toISOString(),
              status: g.status as "ACTIVE" | "EXPIRED" | "REVOKED",
              user: g.request?.requester
                ? {
                    name: g.request.requester.name,
                    email: g.request.requester.email,
                  }
                : undefined,
            }))}
            showRevokeButton={isAdmin}
          />
        </CardContent>
      </Card>
    </div>
  );
}
