"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";

interface MicrosoftConnectButtonProps {
  isConnected?: boolean;
  tenantId?: string | null;
}

export function MicrosoftConnectButton({
  isConnected = false,
  tenantId,
}: MicrosoftConnectButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/integrations/microsoft/connect", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to initiate connection");
      }

      const { url } = await response.json();
      // Redirect to Microsoft admin consent URL
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      setIsLoading(false);
    }
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">Connected</span>
          {tenantId && (
            <span className="text-xs text-emerald-600 font-mono">
              ({tenantId.slice(0, 8)}...)
            </span>
          )}
        </div>
        <Button
          onClick={handleConnect}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Reconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      <Button
        onClick={handleConnect}
        disabled={isLoading}
        className="bg-[#0078d4] hover:bg-[#106ebe] text-white font-medium"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirecting to Microsoft...
          </>
        ) : (
          <>
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 21 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M10 0H0V10H10V0Z" fill="#F25022" />
              <path d="M21 0H11V10H21V0Z" fill="#7FBA00" />
              <path d="M10 11H0V21H10V11Z" fill="#00A4EF" />
              <path d="M21 11H11V21H21V11Z" fill="#FFB900" />
            </svg>
            Connect Microsoft 365
            <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-70" />
          </>
        )}
      </Button>
      <p className="text-xs text-gray-500">
        You will be redirected to Microsoft to grant admin consent for AccessPilot.
        Required permissions: User.Read.All, Group.ReadWrite.All,
        RoleManagement.ReadWrite.Directory
      </p>
    </div>
  );
}
