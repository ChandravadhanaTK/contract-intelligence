import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, CheckCircle2, Clock, ShieldAlert, Calendar, FileDown,
  FileText, Search, ChevronDown, Eye,
} from "lucide-react";
import { api } from "@/services/mockApi";
import type { TrackerObligation } from "@/data/seed";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const statusIcons: Record<string, React.ReactNode> = {
  Overdue: <AlertTriangle className="w-4 h-4 text-destructive" />,
  "At Risk": <ShieldAlert className="w-4 h-4 text-amber-500" />,
  Compliant: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  Upcoming: <Clock className="w-4 h-4 text-blue-500" />,
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

function generateICSContent(obligations: TrackerObligation[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Optum Contract Intelligence//Obligation Tracker//EN",
  ];
  obligations.forEach(o => {
    const dateStr = o.dueDate.replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `SUMMARY:${o.title}`,
      `DESCRIPTION:Contract: ${o.contract}\\nCategory: ${o.category}\\nOwner: ${o.owner}\\nRisk: ${o.risk}\\nStatus: ${o.status}\\nEvidence: ${o.evidence}`,
      `UID:${o.id}@optum-ci`,
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateReport(obligations: TrackerObligation[], format: "json" | "csv" | "md" | "txt") {
  if (format === "json") {
    downloadFile(JSON.stringify(obligations, null, 2), "compliance-report.json", "application/json");
  } else if (format === "csv") {
    const header = "ID,Title,Contract,Category,Owner,Due Date,Risk,Status,Evidence";
    const rows = obligations.map(o => `${o.id},"${o.title}","${o.contract}",${o.category},${o.owner},${o.dueDate},${o.risk},${o.status},${o.evidence}`);
    downloadFile([header, ...rows].join("\n"), "compliance-report.csv", "text/csv");
  } else if (format === "md") {
    const lines = [
      "# Compliance Report",
      "",
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
      "",
      "| Obligation | Contract | Category | Owner | Due Date | Risk | Status | Evidence |",
      "|---|---|---|---|---|---|---|---|",
      ...obligations.map(o => `| ${o.title} | ${o.contract} | ${o.category} | ${o.owner} | ${o.dueDate} | ${o.risk} | ${o.status} | ${o.evidence} |`),
    ];
    downloadFile(lines.join("\n"), "compliance-report.md", "text/markdown");
  } else {
    const lines = [
      "COMPLIANCE REPORT",
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
      "=".repeat(80),
      "",
      ...obligations.map(o => [
        `Title: ${o.title}`,
        `Contract: ${o.contract}`,
        `Category: ${o.category} | Owner: ${o.owner} | Due: ${o.dueDate}`,
        `Risk: ${o.risk} | Status: ${o.status} | Evidence: ${o.evidence}`,
        "-".repeat(60),
      ].join("\n")),
    ];
    downloadFile(lines.join("\n"), "compliance-report.txt", "text/plain");
  }
  toast.success(`Compliance report downloaded as .${format}`);
}

export default function ObligationCompliance() {
  const navigate = useNavigate();
  const [obligations, setObligations] = useState<TrackerObligation[]>([]);
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [showReportMenu, setShowReportMenu] = useState(false);

  useEffect(() => {
    api.getTrackerObligations(statusFilter, categoryFilter).then(setObligations);
  }, [statusFilter, categoryFilter]);

  const allObs = obligations;
  const overdue = allObs.filter(o => o.status === "Overdue").length;
  const atRisk = allObs.filter(o => o.status === "At Risk").length;
  const compliant = allObs.filter(o => o.status === "Compliant").length;
  const upcoming = allObs.filter(o => o.status === "Upcoming").length;

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

  const handleExportCalendar = () => {
    const icsContent = generateICSContent(allObs);
    downloadFile(icsContent, "obligations-calendar.ics", "text/calendar");
    toast.success("Calendar exported as .ics file");
  };

  return (
    <div className="page-container">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="page-header">Obligation Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor compliance, deadlines, and risk across all healthcare contracts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCalendar} className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-muted flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Export Calendar
          </button>
          <div className="relative">
            <button onClick={() => setShowReportMenu(!showReportMenu)} className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-1.5">
              <FileDown className="w-3.5 h-3.5" /> Compliance Report <ChevronDown className="w-3 h-3" />
            </button>
            {showReportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowReportMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-card border rounded-lg shadow-xl z-50 py-1 w-36">
                  {([["json", "JSON"], ["csv", "CSV"], ["md", "Markdown"], ["txt", "Text"]] as const).map(([fmt, label]) => (
                    <button key={fmt} onClick={() => { generateReport(allObs, fmt); setShowReportMenu(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted">
                      Download as .{fmt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KPI row */}
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

      {/* Compliance Score and By Category — separated */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Compliance Score */}
        <div className="bg-card border rounded-lg p-5 flex items-center gap-6">
          <div className="relative w-28 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={35} outerRadius={52} startAngle={90} endAngle={-270} paddingAngle={2}>
                  {donutData.map((_, i) => <Cell key={i} fill={donutColors[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{complianceScore}%</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1">Compliance Score</h4>
            <p className="text-xs text-muted-foreground">{totalCompliant} of {allObs.length} obligations compliant</p>
            <p className="text-xs text-muted-foreground mt-1">{overdue} overdue • {atRisk} at risk</p>
          </div>
        </div>

        {/* By Category */}
        <div className="bg-card border rounded-lg p-5">
          <h4 className="text-sm font-semibold mb-3">Compliance by Category</h4>
          <div className="space-y-2.5">
            {categoryBreakdown.map(c => (
              <div key={c.category} className="flex items-center gap-3">
                <span className="text-xs text-foreground w-24">{c.category}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: c.total ? `${(c.compliant / c.total) * 100}%` : "0%" }} />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">{c.compliant}/{c.total}</span>
              </div>
            ))}
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
                <th className="text-left p-3 font-medium">Frequency</th>
                <th className="text-left p-3 font-medium">Due Date</th>
                <th className="text-left p-3 font-medium">Risk</th>
                <th className="text-left p-3 font-medium">Evidence</th>
                <th className="text-left p-3 font-medium">Document</th>
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
                  <td className="p-3">
                    <button
                      onClick={() => navigate(`/contracts/${o.contractId}`)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                    >
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
