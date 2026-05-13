"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Shield, Clock, AlertCircle } from "lucide-react";

const DURATION_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "240", label: "4 hours" },
  { value: "480", label: "8 hours" },
  { value: "1440", label: "24 hours" },
  { value: "4320", label: "3 days" },
  { value: "10080", label: "7 days" },
];

const requestSchema = z.object({
  policyId: z.string().min(1, "Please select a policy"),
  resourceId: z.string().min(1, "Resource ID is required"),
  resourceName: z.string().min(1, "Resource name is required"),
  requestedDurationMinutes: z.coerce
    .number()
    .min(1, "Duration must be at least 1 minute")
    .max(10080, "Duration cannot exceed 7 days"),
  justification: z.string().min(10, "Justification must be at least 10 characters"),
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface Policy {
  id: string;
  name: string;
  resourceType: string;
  maxDurationMinutes: number;
  requiresJustification: boolean;
  autoApprove: boolean;
}

interface RequestFormProps {
  policies: Policy[];
}

export function RequestForm({ policies }: RequestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      policyId: "",
      resourceId: "",
      resourceName: "",
      requestedDurationMinutes: 60,
      justification: "",
    },
  });

  async function onSubmit(data: RequestFormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create request");
      }

      const result = await response.json();
      router.push(`/requests/${result.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handlePolicyChange = (policyId: string) => {
    const policy = policies.find((p) => p.id === policyId);
    setSelectedPolicy(policy || null);
    form.setValue("policyId", policyId);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Policy selection */}
        <Card className="border-gray-700/50 bg-gray-800/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-100 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              Access Policy
            </CardTitle>
            <CardDescription>
              Select the policy that governs this access request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="policyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy</FormLabel>
                  <Select
                    onValueChange={handlePolicyChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an access policy..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {policies.map((policy) => (
                        <SelectItem key={policy.id} value={policy.id}>
                          <div className="flex items-center gap-2">
                            <span>{policy.name}</span>
                            <span className="text-xs text-gray-500">
                              ({policy.resourceType.replace("_", " ")})
                            </span>
                            {policy.autoApprove && (
                              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                                Auto-approve
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedPolicy && (
              <div className="mt-3 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                <p className="text-xs text-blue-300 font-medium mb-1">Policy Details</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                  <span>Max duration: {Math.floor(selectedPolicy.maxDurationMinutes / 60)}h</span>
                  <span>
                    {selectedPolicy.autoApprove
                      ? "✓ Auto-approved"
                      : "⏳ Requires approval"}
                  </span>
                  <span>Type: {selectedPolicy.resourceType.replace("_", " ")}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resource details */}
        <Card className="border-gray-700/50 bg-gray-800/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-100">
              Resource Details
            </CardTitle>
            <CardDescription>
              Specify the resource you need access to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="resourceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Global Administrator, IT Operations Group"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The human-readable name of the role or group
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resource ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The Entra ID object ID (GUID) for the role or group
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Duration & justification */}
        <Card className="border-gray-700/50 bg-gray-800/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-400" />
              Duration & Justification
            </CardTitle>
            <CardDescription>
              How long do you need this access, and why?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="requestedDurationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested Duration</FormLabel>
                  <Select
                    onValueChange={(val) =>
                      field.onChange(parseInt(val, 10))
                    }
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DURATION_OPTIONS.filter(
                        (opt) =>
                          !selectedPolicy ||
                          parseInt(opt.value, 10) <=
                            selectedPolicy.maxDurationMinutes
                      ).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPolicy && (
                    <FormDescription>
                      Policy maximum: {Math.floor(selectedPolicy.maxDurationMinutes / 60)} hours
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Justification</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why you need this access. Be specific about the task, incident, or project that requires elevated privileges..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear business justification (required for audit
                    compliance)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
