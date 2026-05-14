import { NextResponse } from "next/server";
import { Webhook } from "svix";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await request.text();
  const wh = new Webhook(webhookSecret);

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;

  switch (type) {
    case "user.created": {
      const emailAddress = (data.email_addresses as Array<{ email_address: string }>)?.[0]?.email_address;
      const firstName = data.first_name as string | undefined;
      const lastName = data.last_name as string | undefined;
      const imageUrl = data.image_url as string | undefined;
      if (emailAddress) {
        await prisma.user.upsert({
          where: { clerkUserId: data.id as string },
          update: {},
          create: {
            clerkUserId: data.id as string,
            email: emailAddress,
            name: [firstName, lastName].filter(Boolean).join(" ") || emailAddress,
            avatarUrl: imageUrl,
            organizationId: "placeholder", // resolved when user joins org
            role: "REQUESTER",
          },
        }).catch(() => null); // ignore if org doesn't exist yet
      }
      break;
    }

    case "organizationMembership.created": {
      const orgData = data.organization as { id: string; name: string } | undefined;
      const memberData = data.public_user_data as { user_id: string; identifier: string; first_name?: string; last_name?: string; image_url?: string } | undefined;
      const role = (data.role as string) === "org:admin" ? "ADMIN" : "REQUESTER";

      if (orgData && memberData) {
        let org = await prisma.organization.findUnique({ where: { clerkOrgId: orgData.id } });
        if (!org) {
          org = await prisma.organization.create({
            data: { name: orgData.name, clerkOrgId: orgData.id },
          });
        }

        await prisma.user.upsert({
          where: { clerkUserId: memberData.user_id },
          update: { organizationId: org.id, role },
          create: {
            clerkUserId: memberData.user_id,
            email: memberData.identifier,
            name: [memberData.first_name, memberData.last_name].filter(Boolean).join(" ") || memberData.identifier,
            avatarUrl: memberData.image_url,
            organizationId: org.id,
            role,
          },
        });
      }
      break;
    }

    case "organization.created": {
      await prisma.organization.upsert({
        where: { clerkOrgId: data.id as string },
        update: {},
        create: {
          name: data.name as string,
          clerkOrgId: data.id as string,
        },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
