import { Card, CardContent } from "@/components/ui/card";
import {
  ClipboardList,
  Key,
  Shield,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsData {
  pendingRequests: number;
  activeGrants: number;
  totalPolicies: number;
  expiringGrants: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  trend?: { value: number; positive: boolean };
  urgent?: boolean;
}

function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  urgent,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all hover:border-gray-600",
        urgent && "border-amber-500/30 bg-amber-500/5"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{title}</p>
            <p
              className={cn(
                "mt-2 text-3xl font-bold",
                urgent ? "text-amber-400" : "text-gray-100"
              )}
            >
              {value.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              urgent
                ? "bg-amber-500/20 text-amber-400"
                : "bg-blue-500/20 text-blue-400"
            )}
          >
            {icon}
          </div>
        </div>

        {trend && (
          <div className="mt-4 flex items-center gap-1.5">
            <TrendingUp
              className={cn(
                "h-3.5 w-3.5",
                trend.positive ? "text-emerald-400" : "text-red-400"
              )}
            />
            <span
              className={cn(
                "text-xs font-medium",
                trend.positive ? "text-emerald-400" : "text-red-400"
              )}
            >
              {trend.positive ? "+" : "-"}{Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-500">from last week</span>
          </div>
        )}
      </CardContent>

      {/* Subtle gradient accent */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5",
          urgent
            ? "bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0"
            : "bg-gradient-to-r from-blue-500/0 via-blue-500/30 to-blue-500/0"
        )}
      />
    </Card>
  );
}

export function StatsCards({ stats }: { stats: StatsData }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Pending Requests"
        value={stats.pendingRequests}
        icon={<ClipboardList className="h-5 w-5" />}
        description="Awaiting approval"
        urgent={stats.pendingRequests > 5}
      />
      <StatCard
        title="Active Grants"
        value={stats.activeGrants}
        icon={<Key className="h-5 w-5" />}
        description="Currently provisioned"
        trend={{ value: 12, positive: true }}
      />
      <StatCard
        title="Active Policies"
        value={stats.totalPolicies}
        icon={<Shield className="h-5 w-5" />}
        description="Across all resource types"
      />
      <StatCard
        title="Expiring Soon"
        value={stats.expiringGrants}
        icon={<Clock className="h-5 w-5" />}
        description="Within the next hour"
        urgent={stats.expiringGrants > 0}
      />
    </div>
  );
}
