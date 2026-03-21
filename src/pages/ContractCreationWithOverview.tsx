import { useState } from "react";
import { FileText, PenLine, Users, Eye, CheckCircle2, Globe, ArrowDownToLine, GitBranch, ClipboardList, UserCheck, Bot, Zap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

const pipelineStages = ["Draft", "Collaboration", "Review", "Approval", "Published", "Downstream"];
const pipelineColors = ["bg-amber-400", "bg-blue-500", "bg-violet-500", "bg-orange-500", "bg-emerald-500", "bg-teal-500"];
const pipelineCounts = [12, 8, 7, 5, 6, 4];

function ContractWorkflowPipeline() {
  const pipelineTotal = pipelineCounts.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="bg-card border rounded-lg p-5">
      <h3 className="text-sm font-semibold mb-3">Contract Workflow Pipeline</h3>
      <div className="w-full h-4 rounded-full bg-muted flex overflow-hidden">
        {pipelineStages.map((stage, i) => {
          const width = (pipelineCounts[i] / pipelineTotal) * 100;
          if (width === 0) return null;
          return <div key={stage} className={`h-full ${pipelineColors[i]}`} style={{ width: `${width}%` }} />;
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-3">
        {pipelineStages.map((stage, i) => (
          <div key={stage} className="flex items-center gap-1.5 text-xs">
            <div className={`w-3 h-3 rounded-sm ${pipelineColors[i]}`} />
            <span className="text-muted-foreground">{stage} ({pipelineCounts[i]})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ContractCreationWithOverview() {
  const [subTab, setSubTab] = useState("newgen");

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-muted/60 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="newgen" className="flex items-center gap-1.5 text-xs">
            <Zap className="w-3.5 h-3.5" /> NewGen Contract Digitization
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-1.5 text-xs">
            <ClipboardList className="w-3.5 h-3.5" /> Review Contracts Dashboard
          </TabsTrigger>
          <TabsTrigger value="hitl" className="flex items-center gap-1.5 text-xs">
            <UserCheck className="w-3.5 h-3.5" /> HITL Center
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-1.5 text-xs">
            <Bot className="w-3.5 h-3.5" /> Agent Workspace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="newgen">
          <div className="space-y-6">
            {/* KPI Overview Cards */}
            <div>
              <h1 className="page-header">NewGen Contract Digitization</h1>
              <p className="text-sm text-muted-foreground mt-1">OCR + AI pipeline for creating payer contracts into structured data</p>
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

            {/* Pipeline status bar */}
            <ContractWorkflowPipeline />

            {/* Workflow content */}
            <WorkflowPage embedded initialTab="workflow" />
          </div>
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
