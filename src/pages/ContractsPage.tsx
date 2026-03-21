import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FolderOpen, ScanLine, FileText } from "lucide-react";
import ContractsOverviewTab from "./ContractsOverviewTab";
import DigitizationPage from "./DigitizationPage";
import ContractCreationWithOverview from "./ContractCreationWithOverview";

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="page-container">
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
      </Tabs>
    </div>
  );
}
