import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const MICROSOFT_AUTHORITY = "https://login.microsoftonline.com/common";
const SCOPES = [
  "https://graph.microsoft.com/User.Read.All",
  "https://graph.microsoft.com/Group.ReadWrite.All",
  "https://graph.microsoft.com/RoleManagement.ReadWrite.Directory",
  "https://graph.microsoft.com/AuditLog.Read.All",
].join(" ");

export async function GET(_request: Request) {
  const { userId, orgId } = auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const user = await prisma.user.findFirst({ where: { clerkUserId: userId, organizationId: org.id } });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only admins can connect integrations" }, { status: 403 });
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/microsoft/callback`;

  const state = Buffer.from(JSON.stringify({ orgId: org.id, clerkOrgId: orgId })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: `offline_access openid profile ${SCOPES}`,
    state,
    prompt: "admin_consent",
  });

  const authUrl = `${MICROSOFT_AUTHORITY}/adminconsent?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
