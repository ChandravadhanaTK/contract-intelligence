import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, Calendar, FileDown,
  FileText, Search, ChevronDown,
} from "lucide-react";
import { api } from "@/services/mockApi";
import type { TrackerObligation } from "@/data/seed";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const statusIcons: Record<string, React.ReactNode> = {
  Overdue: <AlertTriangle className="w-4 h-4 text-destructive" />,
  "At Risk": <ShieldAlert className="w-4 h-4 text-amber-500" />,
  Compliant: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  Upcoming: <Clock className="w-4 h-4 text-blue-500" />,
};

const statusChip: Record<string, string> = {
  Overdue: "bg-red-100 text-red-700",
  "At Risk": "bg-amber-100 text-amber-700",
  Compliant: "bg-emerald-100 text-emerald-700",
  Upcoming: "bg-blue-100 text-blue-700",
};

const riskChip: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

const evidenceChip: Record<string, string> = {
  Missing: "text-destructive font-medium",
  Pending: "text-amber-600 font-medium",
  Submitted: "text-emerald-600 font-medium",
};

export default function ObligationCompliance() {
  const [obligations, setObligations] = useState<TrackerObligation[]>([]);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  useEffect(() => {
    api.getTrackerObligations(statusFilter, categoryFilter).then(setObligations);
  }, [statusFilter, categoryFilter]);

  const allObs = obligations;
  const overdue = allObs.filter(o => o.status === "Overdue").length;
  const atRisk = allObs.filter(o => o.status === "At Risk").length;
  const compliant = allObs.filter(o => o.status === "Compliant").length;
  const upcoming = allObs.filter(o => o.status === "Upcoming").length;

  // Category breakdown for "All" view
  const categories = ["Compliance", "Financial", "Operational", "Reporting", "Insurance"];
  const categoryBreakdown = categories.map(cat => {
    const total = allObs.filter(o => o.category === cat).length;
    const comp = allObs.filter(o => o.category === cat && o.status === "Compliant").length;
    return { category: cat, compliant: comp, total };
  });
  const totalCompliant = allObs.filter(o => o.status === "Compliant").length;
  const complianceScore = allObs.length > 0 ? Math.round((totalCompliant / allObs.length) * 100) : 0;

  const donutData = [
    { name: "Compliant", value: totalCompliant },
    { name: "Non-compliant", value: allObs.length - totalCompliant },
  ];
  const donutColors = ["hsl(145, 63%, 42%)", "hsl(210, 20%, 90%)"];

  return (
    <div className="page-container">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="page-header">Obligation Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor compliance, deadlines, and risk across all healthcare contracts</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-muted flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Export Calendar
          </button>
          <button className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-1.5">
            <FileDown className="w-3.5 h-3.5" /> Compliance Report
          </button>
        </div>
      </div>

      {/* KPI row + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Overdue", value: overdue, accent: "bg-red-100 text-red-700", icon: <AlertTriangle className="w-4 h-4" /> },
            { label: "At Risk", value: atRisk, accent: "bg-amber-100 text-amber-700", icon: <ShieldAlert className="w-4 h-4" /> },
            { label: "Compliant", value: compliant, accent: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-4 h-4" /> },
            { label: "Upcoming", value: upcoming, accent: "bg-blue-100 text-blue-700", icon: <Clock className="w-4 h-4" /> },
          ].map(k => (
            <div key={k.label} className="kpi-card flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${k.accent}`}>{k.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{k.label}</p>
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Compliance score donut */}
        <div className="bg-card border rounded-lg p-5">
          <h4 className="text-xs font-semibold mb-2">Compliance Score</h4>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" innerRadius={25} outerRadius={38} startAngle={90} endAngle={-270} paddingAngle={2}>
                    {donutData.map((_, i) => <Cell key={i} fill={donutColors[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{complianceScore}%</span>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">By Category</p>
              {categoryBreakdown.map(c => (
                <div key={c.category} className="flex items-center gap-2">
                  <span className="text-[11px] text-foreground flex-1">{c.category}</span>
                  <div className="w-16 bg-muted rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: c.total ? `${(c.compliant / c.total) * 100}%` : "0%" }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground w-8">{c.compliant}/{c.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs border rounded-lg px-3 py-1.5 bg-background">
          <option>All Statuses</option>
          <option>Overdue</option>
          <option>At Risk</option>
          <option>Compliant</option>
          <option>Upcoming</option>
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="text-xs border rounded-lg px-3 py-1.5 bg-background">
          <option>All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs">
                <th className="p-3 w-8"></th>
                <th className="text-left p-3 font-medium">Obligation</th>
                <th className="text-left p-3 font-medium">Contract</th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-left p-3 font-medium">Owner</th>
                <th className="text-left p-3 font-medium">Due Date</th>
                <th className="text-left p-3 font-medium">Risk</th>
                <th className="text-left p-3 font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {obligations.map(o => (
                <tr key={o.id} className="hover:bg-muted/20">
                  <td className="p-3">{statusIcons[o.status]}</td>
                  <td className="p-3 text-xs font-medium">{o.title}</td>
                  <td className="p-3 text-xs text-muted-foreground">{o.contract}</td>
                  <td className="p-3"><span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{o.category}</span></td>
                  <td className="p-3 text-xs">{o.owner}</td>
                  <td className={`p-3 text-xs ${o.status === "Overdue" ? "text-destructive font-medium" : ""}`}>{o.dueDate}</td>
                  <td className="p-3"><span className={`status-chip ${riskChip[o.risk]}`}>{o.risk}</span></td>
                  <td className="p-3"><span className={`text-xs ${evidenceChip[o.evidence]}`}>{o.evidence}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
