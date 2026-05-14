import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { writeAuditLog, extractRequestContext, AUDIT_ACTIONS } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { userId, orgId } = auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const user = await prisma.user.findFirst({ where: { clerkUserId: userId, organizationId: org.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.role === "REQUESTER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { comment } = body;

  const accessRequest = await prisma.accessRequest.findFirst({
    where: { id: params.id, organizationId: org.id, status: "PENDING" },
    include: { policy: true },
  });

  if (!accessRequest) {
    return NextResponse.json({ error: "Request not found or not pending" }, { status: 404 });
  }

  const expiresAt = new Date(Date.now() + accessRequest.requestedDurationMinutes * 60 * 1000);
  const ctx = extractRequestContext(request);

  const [updatedRequest] = await prisma.$transaction([
    prisma.accessRequest.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        approvedById: user.id,
        approvedAt: new Date(),
        expiresAt,
      },
    }),
    prisma.accessGrant.create({
      data: {
        requestId: accessRequest.id,
        userId: accessRequest.requesterId,
        organizationId: org.id,
        resourceType: accessRequest.policy.resourceType,
        resourceId: accessRequest.resourceId,
        resourceName: accessRequest.resourceName,
        expiresAt,
        status: "ACTIVE",
      },
    }),
    prisma.approvalStep.updateMany({
      where: { requestId: params.id, status: "PENDING" },
      data: { status: "APPROVED", decidedAt: new Date(), comment },
    }),
  ]);

  await writeAuditLog({
    organizationId: org.id,
    userId: user.id,
    action: AUDIT_ACTIONS.REQUEST_APPROVED,
    resourceType: accessRequest.policy.resourceType,
    resourceId: accessRequest.resourceId,
    metadata: { requestId: params.id, comment, expiresAt },
    ...ctx,
  });

  return NextResponse.json(updatedRequest);
}
