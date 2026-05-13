import prisma from "./prisma";

// ─── Audit Action Constants ───────────────────────────────────────────────────

export const AUDIT_ACTIONS = {
  // Access Requests
  REQUEST_CREATED: "request.created",
  REQUEST_APPROVED: "request.approved",
  REQUEST_DENIED: "request.denied",
  REQUEST_EXPIRED: "request.expired",
  REQUEST_REVOKED: "request.revoked",

  // Access Grants
  GRANT_CREATED: "grant.created",
  GRANT_EXPIRED: "grant.expired",
  GRANT_REVOKED: "grant.revoked",

  // Policies
  POLICY_CREATED: "policy.created",
  POLICY_UPDATED: "policy.updated",
  POLICY_DELETED: "policy.deleted",

  // Auth
  USER_SIGNED_IN: "user.signed_in",
  USER_SIGNED_OUT: "user.signed_out",

  // Integrations
  INTEGRATION_CONNECTED: "integration.connected",
  INTEGRATION_DISCONNECTED: "integration.disconnected",

  // Organization
  ORG_SETTINGS_UPDATED: "org.settings_updated",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

// ─── Write Audit Log ──────────────────────────────────────────────────────────

export interface WriteAuditLogParams {
  organizationId: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(
  params: WriteAuditLogParams
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      metadata: params.metadata || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

// ─── Extract Request Context ──────────────────────────────────────────────────

export function extractRequestContext(request: Request): {
  ipAddress: string;
  userAgent: string;
} {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  return { ipAddress, userAgent };
}
