import { useState } from "react";
import { FileText, PenLine, Users, Eye, CheckCircle2, Globe, ArrowDownToLine, ClipboardList, UserCheck, Bot, Zap, Upload, ArrowRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import WorkflowPage from "./WorkflowPage";
import ContractCreation from "./ContractCreation";

const kpiCards = [
  { label: "Total Documents", value: 42, icon: <FileText className="w-4 h-4" />, accent: "bg-primary/10 text-primary" },
  { label: "Draft", value: 12, icon: <PenLine className="w-4 h-4" />, accent: "bg-amber-100 text-amber-700" },
  { label: "Collaboration", value: 8, icon: <Users className="w-4 h-4" />, accent: "bg-blue-100 text-blue-700" },
  { label: "Review", value: 7, icon: <Eye className="w-4 h-4" />, accent: "bg-violet-100 text-violet-700" },
  { label: "Approved", value: 5, icon: <CheckCircle2 className="w-4 h-4" />, accent: "bg-orange-100 text-orange-700" },
  { label: "Published", value: 6, icon: <Globe className="w-4 h-4" />, accent: "bg-emerald-100 text-emerald-700" },
  { label: "Processed to Downstream", value: 4, icon: <ArrowDownToLine className="w-4 h-4" />, accent: "bg-teal-100 text-teal-700" },
];

const pipelineStages = ["Draft", "Collaboration", "Review", "Approval", "Published", "Downstream"];
const pipelineColors = ["bg-amber-400", "bg-blue-500", "bg-violet-500", "bg-orange-500", "bg-emerald-500", "bg-teal-500"];
const pipelineCounts = [12, 8, 7, 5, 6, 4];

function ContractWorkflowPipeline() {
  const pipelineTotal = pipelineCounts.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="bg-card border rounded-lg p-5">
      <h3 className="text-sm font-semibold mb-3">NewGen Contract Digitization Pipeline</h3>
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

function UploadContractTab() {
  const [uploadMode, setUploadMode] = useState<"single" | "bulk">("single");

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-xl p-5">
        <h3 className="text-base font-semibold text-foreground mb-1">Upload Contract</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose how you'd like to upload your contract documents for processing.
        </p>
        <RadioGroup
          value={uploadMode}
          onValueChange={(v) => setUploadMode(v as "single" | "bulk")}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="single" id="upload-single" />
            <Label htmlFor="upload-single" className="text-sm font-medium cursor-pointer">
              Single File Upload
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="bulk" id="upload-bulk" />
            <Label htmlFor="upload-bulk" className="text-sm font-medium cursor-pointer">
              Bulk File Upload
            </Label>
          </div>
        </RadioGroup>
        <p className="text-xs text-muted-foreground mt-3">
          {uploadMode === "single"
            ? "Upload a single contract document (PDF or DOCX) for OCR processing, contract type identification, and standard clause matching."
            : "Upload multiple contract documents at once for batch processing. Each file will go through the full OCR and extraction pipeline independently."}
        </p>
      </div>

      {uploadMode === "single" ? (
        <ContractCreation embedded initialTab="upload" />
      ) : (
        <ContractCreation embedded initialTab="bulk" />
      )}
    </div>
  );
}

export default function ContractCreationWithOverview() {
  const [subTab, setSubTab] = useState("newgen");

  return (
    <div className="space-y-6">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-muted/60 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="newgen" className="flex items-center gap-1.5 text-xs">
            <Zap className="w-3.5 h-3.5" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-1.5 text-xs">
            <ClipboardList className="w-3.5 h-3.5" /> Review Contract
          </TabsTrigger>
          <TabsTrigger value="hitl" className="flex items-center gap-1.5 text-xs">
            <UserCheck className="w-3.5 h-3.5" /> HITL Center
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-1.5 text-xs">
            <Bot className="w-3.5 h-3.5" /> Agent Workspace
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-1.5 text-xs">
            <Upload className="w-3.5 h-3.5" /> Upload Contract
          </TabsTrigger>
          <TabsTrigger value="intake" className="flex items-center gap-1.5 text-xs">
            <ArrowRight className="w-3.5 h-3.5" /> Provider Intake Contract
          </TabsTrigger>
          <TabsTrigger value="coauthor" className="flex items-center gap-1.5 text-xs">
            <Bot className="w-3.5 h-3.5" /> Talk to your Agent - Your CoAuthor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="newgen">
          <div className="space-y-6">
            <div>
              <h1 className="page-header">NewGen Contract Digitization</h1>
              <p className="text-sm text-muted-foreground mt-1">OCR + AI pipeline for creating payer contracts into structured data</p>
              <div className="mt-4" />
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

            {/* Compliance & Signing Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {complianceMetrics.map(metric => (
                <div key={metric.label} className="kpi-card flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${metric.accent}`}>
                    {metric.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                    <p className="text-xl font-bold text-foreground">{metric.value}</p>
                    {metric.subtitle && <p className="text-[10px] text-muted-foreground">{metric.subtitle}</p>}
                  </div>
                </div>
              ))}
            </div>

            {/* Compliance Deviation Score Graph */}
            <ComplianceDeviationGraph />

            <ContractWorkflowPipeline />
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
        <TabsContent value="upload">
          <UploadContractTab />
        </TabsContent>
        <TabsContent value="intake">
          <ContractCreation embedded initialTab="intake" />
        </TabsContent>
        <TabsContent value="coauthor">
          <ContractPilotTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
