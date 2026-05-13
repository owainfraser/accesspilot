"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";

interface ApprovalPanelProps {
  requestId: string;
  requestStatus: string;
}

export function ApprovalPanel({ requestId, requestStatus }: ApprovalPanelProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isDenying, setIsDenying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (requestStatus !== "PENDING") {
    return null;
  }

  async function handleApprove() {
    setIsApproving(true);
    setError(null);
    try {
      const response = await fetch(`/api/requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to approve request");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsApproving(false);
    }
  }

  async function handleDeny() {
    if (!comment.trim()) {
      setError("A reason is required when denying a request");
      return;
    }
    setIsDenying(true);
    setError(null);
    try {
      const response = await fetch(`/api/requests/${requestId}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to deny request");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsDenying(false);
    }
  }

  return (
    <Card className="border-gray-700/50 bg-gray-800/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-gray-100 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Approval Decision
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-gray-300">
            Comment{" "}
            <span className="text-gray-500 font-normal text-xs">
              (required for denial)
            </span>
          </Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment or reason for your decision..."
            className="min-h-[80px] resize-none"
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleDeny}
            disabled={isApproving || isDenying}
            variant="outline"
            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
          >
            {isDenying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Denying...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Deny Request
              </>
            )}
          </Button>

          <Button
            onClick={handleApprove}
            disabled={isApproving || isDenying}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isApproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve Request
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
