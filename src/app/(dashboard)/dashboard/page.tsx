"use client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

interface DashboardData {
  activeOpportunities: number;
  revenuePipeline: number;
  pendingFollowUps: number;
  activeContacts: number;
  aiAlerts: Array<{ id: string; action: string; createdAt: string; details: unknown }>;
}

function KpiCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-neutral-400 mt-1">{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<{ success: boolean; data: DashboardData }>({
    queryKey: ["dashboard"],
    queryFn: () => fetch("/api/dashboard").then((r) => r.json()),
    refetchInterval: 30_000,
  });

  const metrics = data?.data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-neutral-400 text-sm mt-1">AI-powered business overview</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-800 bg-neutral-900 p-6 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Active Opportunities" value={metrics?.activeOpportunities ?? 0} icon="🎯" />
          <KpiCard label="Revenue Pipeline" value={formatCurrency(metrics?.revenuePipeline ?? 0)} icon="💰" />
          <KpiCard label="Pending Follow-ups" value={metrics?.pendingFollowUps ?? 0} icon="📋" />
          <KpiCard label="Active Contacts" value={metrics?.activeContacts ?? 0} icon="👥" />
        </div>
      )}

      {metrics?.aiAlerts && metrics.aiAlerts.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">AI Activity Log</h2>
          <div className="space-y-2">
            {metrics.aiAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 text-sm py-2 border-b border-neutral-800 last:border-0">
                <span className="text-violet-400 font-mono text-xs bg-violet-950 px-2 py-0.5 rounded">{alert.action}</span>
                <span className="text-neutral-400 ml-auto text-xs">{new Date(alert.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
