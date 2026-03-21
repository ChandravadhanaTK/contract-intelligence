import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, TrendingDown, TrendingUp, Clock, DollarSign, ShieldCheck, Users2,
  AlertTriangle, CheckCircle2, ArrowRight, Activity, FileText, BarChart3,
} from "lucide-react";
import { api } from "@/services/mockApi";
import {
  seedPayers, seedProviderFamilies, seedDenialReasons,
  seedRecentActivity, seedComplianceItems,
} from "@/data/seed";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function KPI({ label, value, sub, icon, accent }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; accent?: string }) {
  return (
    <div className="kpi-card flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accent || "bg-primary/10 text-primary"}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  review: "bg-amber-100 text-amber-700",
  expired: "bg-red-100 text-red-700",
};

const complianceStatusDot: Record<string, string> = {
  overdue: "bg-destructive",
  "in-progress": "bg-amber-400",
  pending: "bg-blue-400",
  compliant: "bg-emerald-500",
};

const activityTypeColor: Record<string, string> = {
  success: "text-emerald-600",
  warning: "text-amber-600",
  error: "text-destructive",
  info: "text-primary",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();

  const complianceTotal = seedComplianceItems.length;
  const compliantCount = seedComplianceItems.filter(c => c.status === "compliant").length;
  const compliancePct = Math.round((compliantCount / complianceTotal) * 100);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="page-header">Payer Contract Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time analytics across payer agreements, claims performance & compliance</p>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI label="Active Payers" value={6} sub="total contracts" icon={<Building2 className="w-4 h-4" />} />
        <KPI label="Clean Claim Rate" value="94.2%" sub="vs target" icon={<CheckCircle2 className="w-4 h-4" />} accent="bg-emerald-100 text-emerald-700" />
        <KPI label="Denial Rate" value="8.3%" sub="↑ 1.2% vs last quarter" icon={<TrendingDown className="w-4 h-4" />} accent="bg-red-100 text-red-700" />
        <KPI label="Avg Days to Pay" value={32} sub="Industry avg: 45 days" icon={<Clock className="w-4 h-4" />} />
        <KPI label="Prior Auth Approval" value="78%" icon={<ShieldCheck className="w-4 h-4" />} />
        <KPI label="AI $ 90 Days" value="$245K" sub="AI savings" icon={<DollarSign className="w-4 h-4" />} accent="bg-secondary/10 text-secondary" />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="BAA Compliance" value="87%" icon={<ShieldCheck className="w-4 h-4" />} accent="bg-emerald-100 text-emerald-700" />
        <KPI label="Network Adequacy" value="92%" icon={<Users2 className="w-4 h-4" />} accent="bg-blue-100 text-blue-700" />
        <KPI label="Overdue Obligations" value={3} icon={<AlertTriangle className="w-4 h-4" />} accent="bg-red-100 text-red-700" />
        <KPI label="Credentialing Pending" value={3} sub="Providers awaiting approval" icon={<Clock className="w-4 h-4" />} accent="bg-amber-100 text-amber-700" />
      </div>

      {/* Main content: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Compliance & Obligations */}
        <div className="bg-card border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Compliance & Obligations</h3>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-foreground">{compliancePct}%</span>
              <button onClick={() => navigate("/obligation-tracker")} className="text-xs text-secondary font-medium hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="space-y-2.5">
            {seedComplianceItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${complianceStatusDot[item.status]}`} />
                <span className="flex-1 truncate">{item.title}</span>
                <span className="text-xs text-muted-foreground">{item.dueDate}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Payer Performance */}
        <div className="bg-card border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Payer Performance</h3>
            <button onClick={() => navigate("/compliance-hub")} className="text-xs text-secondary font-medium hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 font-medium">Payer</th>
                  <th className="text-right py-2 font-medium">Contracts</th>
                  <th className="text-right py-2 font-medium">Clean %</th>
                  <th className="text-right py-2 font-medium">Denial %</th>
                  <th className="text-right py-2 font-medium">Value</th>
                  <th className="text-right py-2 font-medium">Renewal</th>
                  <th className="text-right py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {seedPayers.map(p => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2 text-right">{p.contracts}</td>
                    <td className="py-2 text-right">{p.cleanClaimPct}%</td>
                    <td className="py-2 text-right">{p.denialPct}%</td>
                    <td className="py-2 text-right">{p.value}</td>
                    <td className="py-2 text-right">{p.renewal}</td>
                    <td className="py-2 text-right">
                      <span className={`status-chip ${statusColors[p.status]}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Lower area: 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Provider Families */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Provider Families</h3>
            <button onClick={() => navigate("/contracts")} className="text-xs text-secondary font-medium hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></button>
          </div>
          {seedProviderFamilies.map(pf => (
            <div key={pf.id} className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/contracts")}>
              <p className="text-sm font-semibold text-foreground">{pf.name}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {pf.tags.map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{pf.contracts} contracts</p>
            </div>
          ))}
        </div>

        {/* Top Denial Reasons */}
        <div className="bg-card border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Top Denial Reasons</h3>
          <div className="space-y-3">
            {seedDenialReasons.map(d => (
              <div key={d.reason}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground">{d.reason}</span>
                  <span className="text-muted-foreground font-medium">{d.pct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full bg-secondary transition-all" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {seedRecentActivity.map(a => (
              <div key={a.id} className="flex items-start gap-2">
                <Activity className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${activityTypeColor[a.type]}`} />
                <div>
                  <p className="text-xs text-foreground">{a.text}</p>
                  <p className="text-[10px] text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
