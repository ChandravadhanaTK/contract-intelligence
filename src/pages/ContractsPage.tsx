import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FolderOpen, ScanLine, FileText, GitBranch, ClipboardList, UserCheck, Bot } from "lucide-react";
import ContractsOverviewTab from "./ContractsOverviewTab";
import DigitizationPage from "./DigitizationPage";
import ContractCreationWithOverview from "./ContractCreationWithOverview";
import WorkflowPage from "./WorkflowPage";

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="page-container">
      <h1 className="page-header">Contracts</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <TabsList className="bg-muted/60 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs">
            <FolderOpen className="w-3.5 h-3.5" /> Contracts Overview
          </TabsTrigger>
          <TabsTrigger value="digitize" className="flex items-center gap-1.5 text-xs">
            <ScanLine className="w-3.5 h-3.5" /> Digitize Legacy
          </TabsTrigger>
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

        <TabsContent value="overview">
          <ContractsOverviewTab />
        </TabsContent>
        <TabsContent value="digitize">
          <DigitizationPage onBack={() => setActiveTab("overview")} />
        </TabsContent>
        <TabsContent value="creation">
          <ContractCreationWithOverview />
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
