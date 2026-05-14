import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

const resourceTypeLabels: Record<string, string> = {
  ENTRA_ROLE: "Entra Role",
  M365_GROUP: "M365 Group",
  AZURE_RESOURCE: "Azure Resource",
  LOCAL_ADMIN: "Local Admin",
};

const resourceTypeColors: Record<string, string> = {
  ENTRA_ROLE: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  M365_GROUP: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  AZURE_RESOURCE: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  LOCAL_ADMIN: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

export default async function PoliciesPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) redirect("/sign-in");

  const policies = await prisma.accessPolicy.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { requests: true },
      },
    },
  });

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Access Policies</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {policies.length} polic{policies.length !== 1 ? "ies" : "y"} configured
          </p>
        </div>
        {isAdmin && (
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild>
            <Link href="/policies/new">
              <Plus className="mr-2 h-4 w-4" />
              New Policy
            </Link>
          </Button>
        )}
      </div>

      {policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-gray-800 p-4 mb-4">
            <Shield className="h-8 w-8 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">No policies configured</p>
          <p className="text-gray-600 text-sm mt-1">
            Create an access policy to start accepting requests
          </p>
          {isAdmin && (
            <Button
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
              asChild
            >
              <Link href="/policies/new">
                <Plus className="mr-2 h-4 w-4" />
                Create First Policy
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {policies.map((policy) => (
            <Card
              key={policy.id}
              className="border-gray-700/50 bg-gray-800/30 hover:border-gray-600 transition-all group"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={`text-xs ${
                          resourceTypeColors[policy.resourceType] ||
                          "bg-gray-500/20 text-gray-400 border-gray-500/30"
                        }`}
                      >
                        {resourceTypeLabels[policy.resourceType] ||
                          policy.resourceType}
                      </Badge>
                      {!policy.isActive && (
                        <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30 text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-100 truncate">
                      {policy.name}
                    </h3>
                    {policy.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                        {policy.description}
                      </p>
                    )}
                  </div>
                  <div
                    className={`ml-3 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                      policy.isActive ? "bg-blue-500/10" : "bg-gray-700/50"
                    }`}
                  >
                    <Shield
                      className={`h-4.5 w-4.5 ${
                        policy.isActive ? "text-blue-400" : "text-gray-500"
                      }`}
                    />
                  </div>
                </div>

                {/* Policy attributes */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    Max {formatDuration(policy.maxDurationMinutes)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {policy.autoApprove ? (
                      <>
                        <Zap className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Auto-approve</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 text-amber-400" />
                        <span className="text-amber-400">Manual approve</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    {policy.requiresMFA ? (
                      <CheckCircle className="h-3 w-3 text-blue-400" />
                    ) : (
                      <XCircle className="h-3 w-3 text-gray-600" />
                    )}
                    MFA {policy.requiresMFA ? "required" : "optional"}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    {policy.requiresJustification ? (
                      <CheckCircle className="h-3 w-3 text-blue-400" />
                    ) : (
                      <XCircle className="h-3 w-3 text-gray-600" />
                    )}
                    Justification {policy.requiresJustification ? "req." : "opt."}
                  </div>
                </div>

                {/* Request count */}
                <div className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    {policy._count.requests} total request
                    {policy._count.requests !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-gray-600 font-mono">
                    {policy.id.slice(-8)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
