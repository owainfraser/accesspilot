import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { userId, orgId } = auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const user = await prisma.user.findFirst({ where: { clerkUserId: userId, organizationId: org.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const accessRequest = await prisma.accessRequest.findFirst({
    where: {
      id: params.id,
      organizationId: org.id,
      ...(user.role === "REQUESTER" ? { requesterId: user.id } : {}),
    },
    include: {
      requester: { select: { id: true, name: true, email: true, avatarUrl: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      policy: true,
      grant: true,
      approvalSteps: {
        include: { approver: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!accessRequest) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  return NextResponse.json(accessRequest);
}
