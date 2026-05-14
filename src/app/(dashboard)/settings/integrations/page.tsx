import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { MicrosoftConnectButton } from "@/components/integrations/microsoft-connect-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Shield,
  Users,
  Key,
} from "lucide-react";

const REQUIRED_PERMISSIONS = [
  {
    permission: "User.Read.All",
    description: "Read all users to find Entra ID user IDs",
    required: true,
  },
  {
    permission: "Group.ReadWrite.All",
    description: "Add/remove users from M365 groups",
    required: true,
  },
  {
    permission: "RoleManagement.ReadWrite.Directory",
    description: "Assign/remove Entra ID directory roles",
    required: true,
  },
  {
    permission: "Directory.ReadWrite.All",
    description: "Read directory roles and objects",
    required: true,
  },
];

export default async function IntegrationsPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { organization: true },
  });

  if (!user) redirect("/sign-in");
  if (user.role !== "ADMIN") redirect("/settings");

  const org = user.organization;
  const isConnected = Boolean(org.entraIdTenantId && org.entraIdClientId);

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
          <Link href="/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            Microsoft 365 Integration
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Connect your Entra ID tenant for JIT access provisioning
          </p>
        </div>
      </div>

      {/* Connection status */}
      <Card
        className={`border-gray-700/50 ${
          isConnected
            ? "bg-emerald-500/5 border-emerald-500/20"
            : "bg-gray-800/30"
        }`}
      >
        <CardHeader>
          <CardTitle className="text-base text-gray-100 flex items-center gap-2">
            Connection Status
            <Badge
              className={
                isConnected
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-gray-500/20 text-gray-400 border-gray-500/30"
              }
            >
              {isConnected ? "Connected" : "Not Connected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-300">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">
                  Microsoft 365 tenant connected successfully
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tenant ID</p>
                  <p className="font-mono text-xs text-gray-400 truncate">
                    {org.entraIdTenantId}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Client ID</p>
                  <p className="font-mono text-xs text-gray-400 truncate">
                    {org.entraIdClientId}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-gray-300">
                  No Microsoft 365 tenant connected
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Connect your tenant to enable JIT access provisioning via
                  Microsoft Graph API.
                </p>
              </div>
            </div>
          )}

          <Separator className="bg-gray-700/50" />

          <MicrosoftConnectButton
            isConnected={isConnected}
            tenantId={org.entraIdTenantId}
          />
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="border-gray-700/50 bg-gray-800/30">
        <CardHeader>
          <CardTitle className="text-base text-gray-100">
            How the Integration Works
          </CardTitle>
          <CardDescription>
            AccessPilot uses Microsoft Graph API with app-only permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                icon: <Key className="h-4 w-4 text-blue-400" />,
                title: "App-Only Authentication",
                description:
                  "AccessPilot uses client credentials (no user context) to call Graph API on behalf of your organization.",
              },
              {
                icon: <Users className="h-4 w-4 text-violet-400" />,
                title: "User Lookup",
                description:
                  "When granting access, we look up users by email to find their Entra ID object ID.",
              },
              {
                icon: <Shield className="h-4 w-4 text-emerald-400" />,
                title: "Scoped Permissions",
                description:
                  "Only the minimum required permissions are requested. Admin consent is required once per tenant.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 p-3 rounded-lg bg-gray-800/50">
                <div className="flex-shrink-0 mt-0.5">{item.icon}</div>
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Required permissions */}
      <Card className="border-gray-700/50 bg-gray-800/30">
        <CardHeader>
          <CardTitle className="text-base text-gray-100">
            Required API Permissions
          </CardTitle>
          <CardDescription>
            These Graph API permissions require admin consent in your Azure tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {REQUIRED_PERMISSIONS.map((perm) => (
              <div
                key={perm.permission}
                className="flex items-start gap-3 rounded-lg border border-gray-700/50 bg-gray-800/30 p-3"
              >
                <CheckCircle className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-mono font-medium text-gray-200">
                    {perm.permission}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {perm.description}
                  </p>
                </div>
                {perm.required && (
                  <Badge className="ml-auto flex-shrink-0 bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                    Required
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
