import prisma from "./prisma";

// ─── Policy Evaluation ────────────────────────────────────────────────────────

export interface PolicyEvaluationContext {
  policyId: string;
  requesterId: string;
  requestedDurationMinutes: number;
  organizationId: string;
}

export interface PolicyEvaluationResult {
  autoApprove: boolean;
  requiresMFA: boolean;
  requiresJustification: boolean;
  maxDurationMinutes: number;
  approverUserId: string | null;
  approverGroupId: string | null;
  durationExceeded: boolean;
}

/**
 * Evaluates a policy against a request to determine if it can be auto-approved
 * and what constraints apply.
 */
export async function evaluatePolicy(
  context: PolicyEvaluationContext
): Promise<PolicyEvaluationResult> {
  const policy = await prisma.accessPolicy.findUnique({
    where: { id: context.policyId },
  });

  if (!policy) {
    throw new Error(`Policy ${context.policyId} not found`);
  }

  if (policy.organizationId !== context.organizationId) {
    throw new Error("Policy does not belong to this organization");
  }

  if (!policy.isActive) {
    throw new Error("Policy is not active");
  }

  const durationExceeded =
    context.requestedDurationMinutes > policy.maxDurationMinutes;

  // Auto-approve only if: policy allows it AND duration is within limit
  const autoApprove = policy.autoApprove && !durationExceeded;

  return {
    autoApprove,
    requiresMFA: policy.requiresMFA,
    requiresJustification: policy.requiresJustification,
    maxDurationMinutes: policy.maxDurationMinutes,
    approverUserId: policy.approverUserId,
    approverGroupId: policy.approverGroupId,
    durationExceeded,
  };
}

/**
 * Returns the list of approver user IDs for a given policy.
 * Checks both direct approver assignments and approver group membership.
 */
export async function getApproversForPolicy(
  policyId: string,
  organizationId: string
): Promise<string[]> {
  const policy = await prisma.accessPolicy.findUnique({
    where: { id: policyId },
  });

  if (!policy) return [];

  const approvers: string[] = [];

  // Direct user approver
  if (policy.approverUserId) {
    const user = await prisma.user.findFirst({
      where: {
        id: policy.approverUserId,
        organizationId,
      },
    });
    if (user) approvers.push(user.id);
  }

  // Approvers by role — fall back to all APPROVER + ADMIN users in the org
  if (approvers.length === 0) {
    const orgApprovers = await prisma.user.findMany({
      where: {
        organizationId,
        role: { in: ["ADMIN", "APPROVER"] },
      },
      select: { id: true },
    });
    approvers.push(...orgApprovers.map((u) => u.id));
  }

  return approvers;
}

/**
 * Validates that a request duration is within the policy's maximum.
 */
export async function validateRequestDuration(
  policyId: string,
  requestedDurationMinutes: number
): Promise<{ valid: boolean; maxDurationMinutes: number }> {
  const policy = await prisma.accessPolicy.findUnique({
    where: { id: policyId },
    select: { maxDurationMinutes: true },
  });

  if (!policy) {
    return { valid: false, maxDurationMinutes: 0 };
  }

  return {
    valid: requestedDurationMinutes <= policy.maxDurationMinutes,
    maxDurationMinutes: policy.maxDurationMinutes,
  };
}
