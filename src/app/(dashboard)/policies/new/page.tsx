import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PolicyForm } from "@/components/policies/policy-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

export default async function NewPolicyPage() {
  const { userId } = auth();
  if (!userId) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) redirect("/sign-in");

  // Only admins can create policies
  if (user.role !== "ADMIN") {
    redirect("/policies");
  }

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
          <Link href="/policies">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-100">New Access Policy</h1>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            Define rules for access requests and approvals
          </p>
        </div>
      </div>

      <PolicyForm />
    </div>
  );
}
