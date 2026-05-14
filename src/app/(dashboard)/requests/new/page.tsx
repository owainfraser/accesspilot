import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { RequestForm } from "@/components/requests/request-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewRequestPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) redirect("/sign-in");

  const policies = await prisma.accessPolicy.findMany({
    where: {
      organizationId: user.organizationId,
      isActive: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          asChild
        >
          <Link href="/requests">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-100">New Access Request</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Request temporary elevated access to a resource
          </p>
        </div>
      </div>

      {policies.length === 0 ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <p className="text-amber-400 font-medium">No access policies configured</p>
          <p className="text-gray-500 text-sm mt-1">
            An administrator needs to create access policies before you can
            submit requests.
          </p>
          {user.role === "ADMIN" && (
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white" asChild>
              <Link href="/policies/new">Create First Policy</Link>
            </Button>
          )}
        </div>
      ) : (
        <RequestForm policies={policies} />
      )}
    </div>
  );
}
