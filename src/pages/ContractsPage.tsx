import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FolderOpen, ScanLine, FileText } from "lucide-react";
import ContractsOverviewTab from "./ContractsOverviewTab";
import DigitizationPage from "./DigitizationPage";
import ContractCreation from "./ContractCreation";

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="page-container">
      <h1 className="page-header">Contracts</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs">
            <FolderOpen className="w-3.5 h-3.5" /> Contracts Overview
          </TabsTrigger>
          <TabsTrigger value="digitize" className="flex items-center gap-1.5 text-xs">
            <ScanLine className="w-3.5 h-3.5" /> Digitize Legacy
          </TabsTrigger>
          <TabsTrigger value="creation" className="flex items-center gap-1.5 text-xs">
            <FileText className="w-3.5 h-3.5" /> Contract Creation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ContractsOverviewTab />
        </TabsContent>
        <TabsContent value="digitize">
          <DigitizationPage onBack={() => setActiveTab("overview")} />
        </TabsContent>
        <TabsContent value="creation">
          <ContractCreation />
        </TabsContent>
      </Tabs>
    </div>
  );
}
