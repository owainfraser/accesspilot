"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Shield, AlertCircle, Zap } from "lucide-react";

const policySchema = z.object({
  name: z.string().min(1, "Policy name is required").max(100),
  description: z.string().max(500).optional(),
  resourceType: z.enum(["ENTRA_ROLE", "M365_GROUP", "AZURE_RESOURCE", "LOCAL_ADMIN"]),
  autoApprove: z.boolean().default(false),
  maxDurationMinutes: z.coerce
    .number()
    .min(1, "Duration must be at least 1 minute")
    .max(10080, "Duration cannot exceed 7 days"),
  requiresMFA: z.boolean().default(false),
  requiresJustification: z.boolean().default(true),
  approverUserId: z.string().optional(),
});

type PolicyFormValues = z.infer<typeof policySchema>;

const RESOURCE_TYPE_OPTIONS = [
  { value: "ENTRA_ROLE", label: "Entra ID Role", description: "Azure AD directory roles" },
  { value: "M365_GROUP", label: "Microsoft 365 Group", description: "M365 security and distribution groups" },
  { value: "AZURE_RESOURCE", label: "Azure Resource", description: "Azure subscriptions, resource groups" },
  { value: "LOCAL_ADMIN", label: "Local Admin", description: "Local administrator on Windows devices" },
];

export function PolicyForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      name: "",
      description: "",
      resourceType: "ENTRA_ROLE",
      autoApprove: false,
      maxDurationMinutes: 480,
      requiresMFA: false,
      requiresJustification: true,
      approverUserId: "",
    },
  });

  const autoApprove = form.watch("autoApprove");

  async function onSubmit(data: PolicyFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create policy");
      }

      router.push("/policies");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Basic Info */}
        <Card className="border-gray-700/50 bg-gray-800/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-100 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              Policy Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Global Admin JIT Access"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe when and why this policy should be used..."
                      className="min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resourceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RESOURCE_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div>
                            <p>{opt.label}</p>
                            <p className="text-xs text-gray-500">{opt.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Access Rules */}
        <Card className="border-gray-700/50 bg-gray-800/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-100 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              Access Rules
            </CardTitle>
            <CardDescription>
              Configure how access requests are evaluated and approved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="maxDurationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10080}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {Math.floor((field.value as number) / 60)} hours{" "}
                    {(field.value as number) % 60 > 0 &&
                      `${(field.value as number) % 60} minutes`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="autoApprove"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-gray-700 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto-Approve</FormLabel>
                      <FormDescription>
                        Automatically approve requests without human review.
                        Only enable for low-risk resources.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!autoApprove && (
                <FormField
                  control={form.control}
                  name="approverUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Approver User ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="User ID of the designated approver (optional)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave blank to use org-level approvers (all ADMIN/APPROVER users)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="requiresMFA"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-gray-700 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Require MFA</FormLabel>
                      <FormDescription>
                        Require multi-factor authentication before granting access
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiresJustification"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-gray-700 p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Require Justification
                      </FormLabel>
                      <FormDescription>
                        Require users to provide a business justification
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Policy"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
