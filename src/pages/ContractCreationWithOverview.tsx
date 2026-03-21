import { useState } from "react";
import { FileText, PenLine, Users, Eye, CheckCircle2, Globe, ArrowDownToLine, GitBranch, ClipboardList, UserCheck, Bot } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ContractCreation from "./ContractCreation";
import WorkflowPage from "./WorkflowPage";

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
  const [subTab, setSubTab] = useState("creation");

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

      {/* Sub-tabs: Creation + Workflow tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-muted/60 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="creation" className="flex items-center gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" /> Contract Creation
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-1.5 text-xs">
            <GitBranch className="w-3.5 h-3.5" /> Workflow
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-1.5 text-xs">
            <ClipboardList className="w-3.5 h-3.5" /> Review Dashboard
          </TabsTrigger>
          <TabsTrigger value="hitl" className="flex items-center gap-1.5 text-xs">
            <UserCheck className="w-3.5 h-3.5" /> HITL Center
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-1.5 text-xs">
            <Bot className="w-3.5 h-3.5" /> Agent Workspace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="creation">
          <ContractCreation />
        </TabsContent>
        <TabsContent value="workflow">
          <WorkflowPage embedded initialTab="workflow" />
        </TabsContent>
        <TabsContent value="review">
          <WorkflowPage embedded initialTab="review" />
        </TabsContent>
        <TabsContent value="hitl">
          <WorkflowPage embedded initialTab="hitl" />
        </TabsContent>
        <TabsContent value="agents">
          <WorkflowPage embedded initialTab="agents" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
