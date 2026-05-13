"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, ShieldOff, AlertTriangle } from "lucide-react";

interface RevokeButtonProps {
  grantId: string;
  resourceName: string;
}

export function RevokeButton({ grantId, resourceName }: RevokeButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevoke() {
    setIsRevoking(true);
    setError(null);

    try {
      const response = await fetch(`/api/requests/${grantId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to revoke grant");
      }

      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="h-7 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 transition-all"
        >
          <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
          Revoke
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-100">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Revoke Access Grant
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            This action will immediately remove access to{" "}
            <span className="font-semibold text-gray-200">{resourceName}</span>{" "}
            via Microsoft Graph API. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="text-sm text-amber-300">
            <strong>Warning:</strong> The user will lose access immediately. An
            audit log entry will be created.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isRevoking}
            className="border-gray-600 text-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRevoke}
            disabled={isRevoking}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isRevoking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revoking...
              </>
            ) : (
              <>
                <ShieldOff className="mr-2 h-4 w-4" />
                Revoke Access
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
