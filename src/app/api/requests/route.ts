import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractRequestContext, AUDIT_ACTIONS } from "@/lib/audit";
import { evaluatePolicy } from "@/lib/policies";

export async function GET(request: Request) {
  const { userId, orgId } = auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const user = await prisma.user.findFirst({ where: { clerkUserId: userId, organizationId: org.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { organizationId: org.id };
  if (status) where.status = status;
  if (user.role === "REQUESTER") where.requesterId = user.id;

  const [requests, total] = await Promise.all([
    prisma.accessRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, email: true, avatarUrl: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        policy: { select: { id: true, name: true, resourceType: true } },
        grant: true,
        approvalSteps: {
          include: { approver: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.accessRequest.count({ where }),
  ]);

  return NextResponse.json({ requests, total, page, limit });
}

export async function POST(request: Request) {
  const { userId, orgId } = auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const user = await prisma.user.findFirst({ where: { clerkUserId: userId, organizationId: org.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await request.json();
  const { policyId, resourceId, resourceName, justification, requestedDurationMinutes } = body;

  if (!policyId || !resourceId || !resourceName || !requestedDurationMinutes) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const policy = await prisma.accessPolicy.findFirst({
    where: { id: policyId, organizationId: org.id, isActive: true },
  });
  if (!policy) return NextResponse.json({ error: "Policy not found" }, { status: 404 });

  if (requestedDurationMinutes > policy.maxDurationMinutes) {
    return NextResponse.json(
      { error: `Duration exceeds policy maximum of ${policy.maxDurationMinutes} minutes` },
      { status: 400 }
    );
  }

  if (policy.requiresJustification && !justification) {
    return NextResponse.json({ error: "Justification is required for this policy" }, { status: 400 });
  }

  const shouldAutoApprove = await evaluatePolicy(policy, user);
  const ctx = extractRequestContext(request);

  const accessRequest = await prisma.accessRequest.create({
    data: {
      requesterId: user.id,
      organizationId: org.id,
      policyId,
      resourceId,
      resourceName,
      justification,
      requestedDurationMinutes,
      status: shouldAutoApprove ? "APPROVED" : "PENDING",
      approvedById: shouldAutoApprove ? user.id : undefined,
      approvedAt: shouldAutoApprove ? new Date() : undefined,
      expiresAt: shouldAutoApprove
        ? new Date(Date.now() + requestedDurationMinutes * 60 * 1000)
        : undefined,
    },
    include: {
      requester: { select: { id: true, name: true, email: true } },
      policy: true,
    },
  });

  if (shouldAutoApprove) {
    await prisma.accessGrant.create({
      data: {
        requestId: accessRequest.id,
        userId: user.id,
        organizationId: org.id,
        resourceType: policy.resourceType,
        resourceId,
        resourceName,
        expiresAt: accessRequest.expiresAt!,
        status: "ACTIVE",
      },
    });
  } else {
    await prisma.approvalStep.create({
      data: {
        requestId: accessRequest.id,
        approverId: policy.approverUserId || user.id,
        status: "PENDING",
      },
    });
  }

  await writeAuditLog({
    organizationId: org.id,
    userId: user.id,
    action: AUDIT_ACTIONS.REQUEST_CREATED,
    resourceType: policy.resourceType,
    resourceId,
    metadata: { requestId: accessRequest.id, autoApproved: shouldAutoApprove },
    ...ctx,
  });

  return NextResponse.json(accessRequest, { status: 201 });
}
