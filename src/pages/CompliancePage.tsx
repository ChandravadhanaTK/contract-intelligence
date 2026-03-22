import { useState, useEffect } from "react";
import { BackToPipelineBanner } from "@/components/BackToPipelineBanner";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck, BookOpen, GitCompare, Pencil, FileText, CheckCircle2,
  AlertTriangle, Clock, BarChart3, ChevronRight, DollarSign,
} from "lucide-react";
import StandardClauses from "./StandardClauses";
import ContractDeviation from "./ContractDeviation";
import Redlining from "./Redlining";
import { api } from "@/services/mockApi";
import type { ContractFamily, TrackerObligation } from "@/data/seed";

type TabId = "overview" | "clauses" | "deviations" | "redlining";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Compliance Overview", icon: ShieldCheck },
  { id: "clauses", label: "Standard Clauses", icon: BookOpen },
  { id: "deviations", label: "Contract Deviations", icon: GitCompare },
  { id: "redlining", label: "Redlining", icon: Pencil },
];

/* ── Per-contract compliance data (deterministic) ── */
const contractComplianceData: Record<string, {
  clausesExtracted: number;
  totalClauses: number;
  rateLoadStatus: string;
  rateLoadDetails: string;
  compliancePct: number;
  obligationsDue: number;
  obligationsCompliant: number;
  riskLevel: "Low" | "Medium" | "High";
}> = {
  "fd-1": { clausesExtracted: 22, totalClauses: 30, rateLoadStatus: "Loaded", rateLoadDetails: "120% Medicare Fee Schedule • CPI-U 5%", compliancePct: 87, obligationsDue: 4, obligationsCompliant: 3, riskLevel: "Low" },
  "fd-2": { clausesExtracted: 8, totalClauses: 8, rateLoadStatus: "N/A", rateLoadDetails: "BAA — no rate schedule", compliancePct: 100, obligationsDue: 2, obligationsCompliant: 2, riskLevel: "Low" },
  "fd-3": { clausesExtracted: 15, totalClauses: 20, rateLoadStatus: "Pending Review", rateLoadDetails: "Analytics fee: $45K/quarter", compliancePct: 65, obligationsDue: 3, obligationsCompliant: 1, riskLevel: "High" },
  "fd-4": { clausesExtracted: 6, totalClauses: 6, rateLoadStatus: "Loaded", rateLoadDetails: "CPI-U adjustment +5%", compliancePct: 92, obligationsDue: 1, obligationsCompliant: 1, riskLevel: "Low" },
  "fd-5": { clausesExtracted: 18, totalClauses: 25, rateLoadStatus: "Loaded", rateLoadDetails: "110% Medicare Fee Schedule", compliancePct: 78, obligationsDue: 5, obligationsCompliant: 3, riskLevel: "Medium" },
  "fd-6": { clausesExtracted: 8, totalClauses: 8, rateLoadStatus: "N/A", rateLoadDetails: "BAA — no rate schedule", compliancePct: 95, obligationsDue: 2, obligationsCompliant: 2, riskLevel: "Low" },
  "fd-7": { clausesExtracted: 10, totalClauses: 18, rateLoadStatus: "Draft", rateLoadDetails: "$75/visit telehealth flat rate", compliancePct: 45, obligationsDue: 2, obligationsCompliant: 0, riskLevel: "High" },
  "fd-8": { clausesExtracted: 20, totalClauses: 28, rateLoadStatus: "Under Review", rateLoadDetails: "Multi-state negotiated rates", compliancePct: 72, obligationsDue: 6, obligationsCompliant: 3, riskLevel: "Medium" },
  "fd-9": { clausesExtracted: 8, totalClauses: 8, rateLoadStatus: "N/A", rateLoadDetails: "BAA — no rate schedule", compliancePct: 100, obligationsDue: 1, obligationsCompliant: 1, riskLevel: "Low" },
  "fd-10": { clausesExtracted: 12, totalClauses: 15, rateLoadStatus: "Under Review", rateLoadDetails: "Capitation PMPM: $125", compliancePct: 68, obligationsDue: 3, obligationsCompliant: 1, riskLevel: "Medium" },
  "fd-11": { clausesExtracted: 14, totalClauses: 22, rateLoadStatus: "Expired", rateLoadDetails: "Behavioral health per diem: $110", compliancePct: 42, obligationsDue: 4, obligationsCompliant: 0, riskLevel: "High" },
  "fd-12": { clausesExtracted: 6, totalClauses: 8, rateLoadStatus: "Expired", rateLoadDetails: "BAA — expired", compliancePct: 55, obligationsDue: 2, obligationsCompliant: 0, riskLevel: "High" },
  "fd-13": { clausesExtracted: 10, totalClauses: 24, rateLoadStatus: "Draft", rateLoadDetails: "Value-based: shared savings 60/40", compliancePct: 35, obligationsDue: 3, obligationsCompliant: 0, riskLevel: "High" },
  "fd-14": { clausesExtracted: 8, totalClauses: 12, rateLoadStatus: "Draft", rateLoadDetails: "Quality incentive bonus pool: $500K", compliancePct: 40, obligationsDue: 2, obligationsCompliant: 0, riskLevel: "High" },
};

const rateLoadColors: Record<string, string> = {
  Loaded: "bg-emerald-100 text-emerald-700",
  "N/A": "bg-muted text-muted-foreground",
  "Pending Review": "bg-amber-100 text-amber-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Draft: "bg-blue-100 text-blue-700",
  Expired: "bg-red-100 text-red-700",
};

const riskColors: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
};

function ComplianceOverview() {
  const [families, setFamilies] = useState<ContractFamily[]>([]);
  const [obligations, setObligations] = useState<TrackerObligation[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.getContractFamilies().then(setFamilies);
    api.getTrackerObligations().then(setObligations);
  }, []);

  const allDocs = families.flatMap(f => f.documents.map(d => ({ ...d, familyName: f.name, familyStatus: f.status })));
  const totalCompliance = allDocs.length > 0
    ? Math.round(allDocs.reduce((sum, d) => sum + (contractComplianceData[d.id]?.compliancePct || 0), 0) / allDocs.length)
    : 0;
  const highRiskCount = allDocs.filter(d => contractComplianceData[d.id]?.riskLevel === "High").length;
  const overdueObs = obligations.filter(o => o.status === "Overdue").length;

  return (
    <div className="space-y-6">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-100 text-emerald-700"><ShieldCheck className="w-4 h-4" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Overall Compliance</p><p className="text-2xl font-bold text-foreground">{totalCompliance}%</p></div>
        </div>
        <div className="kpi-card flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-700"><FileText className="w-4 h-4" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Total Contracts</p><p className="text-2xl font-bold text-foreground">{allDocs.length}</p></div>
        </div>
        <div className="kpi-card flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-100 text-red-700"><AlertTriangle className="w-4 h-4" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">High Risk</p><p className="text-2xl font-bold text-foreground">{highRiskCount}</p></div>
        </div>
        <div className="kpi-card flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-100 text-amber-700"><Clock className="w-4 h-4" /></div>
          <div><p className="text-xs text-muted-foreground font-medium">Overdue Obligations</p><p className="text-2xl font-bold text-foreground">{overdueObs}</p></div>
        </div>
      </div>

      {/* Per-contract compliance table */}
      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold">Contract Compliance Details</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Clauses, rate loads, compliance, and obligations per contract</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs">
                <th className="text-left p-3 font-medium">Contract</th>
                <th className="text-left p-3 font-medium">Family</th>
                <th className="text-center p-3 font-medium">Clauses Extracted</th>
                <th className="text-left p-3 font-medium">Rate Load</th>
                <th className="text-center p-3 font-medium">Compliance %</th>
                <th className="text-center p-3 font-medium">Obligations</th>
                <th className="text-center p-3 font-medium">Risk</th>
                <th className="text-center p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {families.map(fam => fam.documents.map(doc => {
                const data = contractComplianceData[doc.id] || { clausesExtracted: 0, totalClauses: 0, rateLoadStatus: "N/A", rateLoadDetails: "", compliancePct: 0, obligationsDue: 0, obligationsCompliant: 0, riskLevel: "Medium" as const };
                return (
                  <tr key={doc.id} className="hover:bg-muted/20">
                    <td className="p-3">
                      <p className="text-xs font-medium">{doc.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${doc.type === "MSA" ? "bg-primary/10 text-primary" : doc.type === "BAA" ? "bg-secondary/10 text-secondary" : doc.type === "SOW" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{doc.type}</span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{fam.name.split("—")[0].trim()}</td>
                    <td className="p-3 text-center text-xs">
                      <span className="font-medium">{data.clausesExtracted}</span>
                      <span className="text-muted-foreground">/{data.totalClauses}</span>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${rateLoadColors[data.rateLoadStatus] || "bg-muted text-muted-foreground"}`}>{data.rateLoadStatus}</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{data.rateLoadDetails}</p>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-12 bg-muted rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${data.compliancePct >= 80 ? "bg-emerald-500" : data.compliancePct >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${data.compliancePct}%` }} />
                        </div>
                        <span className="text-xs font-medium">{data.compliancePct}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-xs">
                      <span className="text-emerald-600 font-medium">{data.obligationsCompliant}</span>
                      <span className="text-muted-foreground">/{data.obligationsDue}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${riskColors[data.riskLevel]}`}>{data.riskLevel}</span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => navigate(`/contracts/${doc.id}`)}
                        className="text-[10px] text-secondary hover:underline font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CompliancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as TabId) || "overview";

  const setTab = (tab: TabId) => {
    setSearchParams({ tab });
  };

  return (
    <div className="page-container">
      <h1 className="page-header">Compliance</h1>
      <p className="text-sm text-muted-foreground -mt-3 mb-4">Contract compliance, standard clauses, deviations, and redlining</p>

      {/* Tabs */}
      <div className="flex border-b mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <ComplianceOverview />}
      {activeTab === "clauses" && <StandardClauses />}
      {activeTab === "deviations" && <ContractDeviation />}
      {activeTab === "redlining" && <Redlining />}
    </div>
  );
}
