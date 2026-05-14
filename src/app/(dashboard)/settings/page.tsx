import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Settings,
  Building,
  Users,
  Shield,
  ExternalLink,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default async function SettingsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { organization: true },
  });

  if (!user) redirect("/sign-in");

  if (user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Shield className="h-8 w-8 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Admin Access Required</p>
          <p className="text-gray-600 text-sm mt-1">
            Only organization admins can access settings.
          </p>
        </div>
      </div>
    );
  }

  const org = user.organization;

  const [userCount, policyCount, requestCount] = await Promise.all([
    prisma.user.count({ where: { organizationId: org.id } }),
    prisma.accessPolicy.count({ where: { organizationId: org.id } }),
    prisma.accessRequest.count({ where: { organizationId: org.id } }),
  ]);

  const isM365Connected = Boolean(
    org.entraIdTenantId && org.entraIdClientId
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-400" />
          Settings
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage your organization&apos;s AccessPilot configuration
        </p>
      </div>

      {/* Organization Info */}
      <Card className="border-gray-700/50 bg-gray-800/30">
        <CardHeader>
          <CardTitle className="text-base text-gray-100 flex items-center gap-2">
            <Building className="h-4 w-4 text-blue-400" />
            Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Organization Name</p>
              <p className="text-sm font-medium text-gray-200">{org.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Plan</p>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {org.planTier}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Organization ID</p>
              <p className="text-xs font-mono text-gray-400">{org.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Created</p>
              <p className="text-sm text-gray-400">
                {org.createdAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage stats */}
      <Card className="border-gray-700/50 bg-gray-800/30">
        <CardHeader>
          <CardTitle className="text-base text-gray-100 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />
            Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center rounded-lg bg-gray-800/50 p-4">
              <p className="text-2xl font-bold text-gray-100">{userCount}</p>
              <p className="text-xs text-gray-500 mt-1">Users</p>
            </div>
            <div className="text-center rounded-lg bg-gray-800/50 p-4">
              <p className="text-2xl font-bold text-gray-100">{policyCount}</p>
              <p className="text-xs text-gray-500 mt-1">Policies</p>
            </div>
            <div className="text-center rounded-lg bg-gray-800/50 p-4">
              <p className="text-2xl font-bold text-gray-100">{requestCount}</p>
              <p className="text-xs text-gray-500 mt-1">Total Requests</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* M365 Connection Status */}
      <Card className="border-gray-700/50 bg-gray-800/30">
        <CardHeader>
          <CardTitle className="text-base text-gray-100">
            Microsoft 365 Integration
          </CardTitle>
          <CardDescription>
            Connect your Entra ID tenant to enable JIT access provisioning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  isM365Connected ? "bg-emerald-500/10" : "bg-gray-700/50"
                }`}
              >
                {isM365Connected ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-200">
                  {isM365Connected ? "Connected" : "Not Connected"}
                </p>
                {org.entraIdTenantId && (
                  <p className="text-xs text-gray-500 font-mono">
                    Tenant: {org.entraIdTenantId}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              asChild
            >
              <Link
                href="/settings/integrations"
                className="flex items-center gap-2"
              >
                Manage
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {isM365Connected && (
            <>
              <Separator className="bg-gray-700/50" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Client ID</p>
                  <p className="font-mono text-gray-400 text-xs truncate">
                    {org.entraIdClientId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Tenant ID</p>
                  <p className="font-mono text-gray-400 text-xs truncate">
                    {org.entraIdTenantId}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader>
          <CardTitle className="text-base text-red-400">Danger Zone</CardTitle>
          <CardDescription className="text-gray-500">
            Irreversible actions that affect your entire organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">
                Disconnect Microsoft 365
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Removes the Entra ID connection. Active grants will remain but
                won&apos;t auto-revoke.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
