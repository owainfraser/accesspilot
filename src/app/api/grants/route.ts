import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { userId, orgId } = auth();
  if (!userId || !orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await prisma.organization.findUnique({ where: { clerkOrgId: orgId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const user = await prisma.user.findFirst({ where: { clerkUserId: userId, organizationId: org.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "ACTIVE";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: Record<string, unknown> = { organizationId: org.id, status };
  if (user.role === "REQUESTER") where.userId = user.id;

  const [grants, total] = await Promise.all([
    prisma.accessGrant.findMany({
      where,
      include: {
        request: {
          include: {
            requester: { select: { id: true, name: true, email: true, avatarUrl: true } },
            policy: { select: { id: true, name: true } },
          },
        },
        revokedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { grantedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.accessGrant.count({ where }),
  ]);

  // expire stale grants in-band (low-traffic path; worker handles bulk)
  const now = new Date();
  const expiredIds = grants
    .filter((g) => g.status === "ACTIVE" && g.expiresAt < now)
    .map((g) => g.id);

  if (expiredIds.length > 0) {
    await prisma.accessGrant.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: "EXPIRED" },
    });
    await prisma.accessRequest.updateMany({
      where: { grant: { id: { in: expiredIds } } },
      data: { status: "EXPIRED" },
    });
  }

  return NextResponse.json({ grants, total, page, limit });
}
