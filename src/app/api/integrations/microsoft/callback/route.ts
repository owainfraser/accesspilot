import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeAuditLog, AUDIT_ACTIONS } from "@/lib/audit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  if (error) {
    const msg = encodeURIComponent(errorDescription || error);
    return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?error=${msg}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?error=missing_params`);
  }

  let orgId: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
    orgId = decoded.orgId;
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?error=invalid_state`);
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?error=org_not_found`);
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID!;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;
  const redirectUri = `${appUrl}/api/integrations/microsoft/callback`;

  const tokenRes = await fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?error=token_exchange_failed`);
  }

  const tokens = await tokenRes.json();

  // Fetch tenant info from Graph
  const orgInfoRes = await fetch("https://graph.microsoft.com/v1.0/organization", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  let tenantId = tokens.id_token
    ? JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64").toString()).tid
    : undefined;

  if (orgInfoRes.ok) {
    const orgInfo = await orgInfoRes.json();
    tenantId = orgInfo.value?.[0]?.id || tenantId;
  }

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      entraIdTenantId: tenantId,
      entraClientSecret: tokens.refresh_token, // store refresh token for ongoing access
    },
  });

  await writeAuditLog({
    organizationId: orgId,
    action: AUDIT_ACTIONS.INTEGRATION_CONNECTED,
    resourceType: "microsoft_365",
    metadata: { tenantId },
  });

  return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?success=true`);
}
