import { FileText, PenLine, Users, Eye, CheckCircle2, Globe, ArrowDownToLine } from "lucide-react";
import ContractCreation from "./ContractCreation";

const kpiCards = [
  { label: "Total Documents", value: 42, icon: <FileText className="w-4 h-4" />, accent: "bg-primary/10 text-primary" },
  { label: "In Draft", value: 12, icon: <PenLine className="w-4 h-4" />, accent: "bg-amber-100 text-amber-700" },
  { label: "In Collaboration", value: 8, icon: <Users className="w-4 h-4" />, accent: "bg-blue-100 text-blue-700" },
  { label: "In Review", value: 7, icon: <Eye className="w-4 h-4" />, accent: "bg-violet-100 text-violet-700" },
  { label: "In Approval", value: 5, icon: <CheckCircle2 className="w-4 h-4" />, accent: "bg-orange-100 text-orange-700" },
  { label: "Published", value: 6, icon: <Globe className="w-4 h-4" />, accent: "bg-emerald-100 text-emerald-700" },
  { label: "In Downstream", value: 4, icon: <ArrowDownToLine className="w-4 h-4" />, accent: "bg-teal-100 text-teal-700" },
];

export default function ContractCreationWithOverview() {
  return (
    <div className="space-y-6">
      {/* KPI Overview Cards */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Contract Creation Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {kpiCards.map(kpi => (
            <div key={kpi.label} className="kpi-card flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${kpi.accent}`}>
                {kpi.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                <p className="text-xl font-bold text-foreground">{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Existing Contract Creation */}
      <ContractCreation />
    </div>
  );
}
