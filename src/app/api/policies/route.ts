import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractRequestContext, AUDIT_ACTIONS } from "@/lib/audit";

export async function GET(_request: Request) {
  const { userId, orgId } = auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const policies = await prisma.accessPolicy.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ policies });
}

export async function POST(request: Request) {
  const { userId, orgId } = auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const user = await prisma.user.findFirst({ where: { clerkUserId: userId, organizationId: org.id } });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json();
  const {
    name,
    description,
    resourceType,
    autoApprove,
    maxDurationMinutes,
    requiresMFA,
    requiresJustification,
    approverGroupId,
    approverUserId,
  } = body;

  if (!name || !resourceType) {
    return NextResponse.json({ error: "name and resourceType are required" }, { status: 400 });
  }

  const ctx = extractRequestContext(request);

  const policy = await prisma.accessPolicy.create({
    data: {
      name,
      description,
      organizationId: org.id,
      resourceType,
      autoApprove: autoApprove ?? false,
      maxDurationMinutes: maxDurationMinutes ?? 480,
      requiresMFA: requiresMFA ?? false,
      requiresJustification: requiresJustification ?? true,
      approverGroupId,
      approverUserId,
    },
  });

  await writeAuditLog({
    organizationId: org.id,
    userId: user.id,
    action: AUDIT_ACTIONS.POLICY_CREATED,
    resourceType,
    resourceId: policy.id,
    metadata: { policyName: name },
    ...ctx,
  });

  return NextResponse.json(policy, { status: 201 });
}
