import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import UploadContract from "./pages/UploadContract";
import ContractDeviation from "./pages/ContractDeviation";
import StandardClauses from "./pages/StandardClauses";
import ContractCreation from "./pages/ContractCreation";
import AgentWorkspace from "./pages/AgentWorkspace";
import Redlining from "./pages/Redlining";
import WorkflowPage from "./pages/WorkflowPage";
import DownstreamFeed from "./pages/DownstreamFeed";
import ObligationCompliance from "./pages/ObligationCompliance";
import Dashboard from "./pages/Dashboard";
import IntakePage from "./pages/IntakePage";
import CredentialingPage from "./pages/CredentialingPage";
import IntegrityPage from "./pages/IntegrityPage";
import RatesPage from "./pages/RatesPage";
import MonitoringPage from "./pages/MonitoringPage";
import RenewalsPage from "./pages/RenewalsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/create" replace />} />
            <Route path="/create" element={<ContractCreation />} />
            <Route path="/upload" element={<UploadContract />} />
            <Route path="/deviation" element={<ContractDeviation />} />
            <Route path="/clauses" element={<StandardClauses />} />
            <Route path="/redlining" element={<Redlining />} />
            <Route path="/agents" element={<AgentWorkspace />} />
            <Route path="/workflow" element={<WorkflowPage />} />
            <Route path="/downstream" element={<DownstreamFeed />} />
            <Route path="/compliance" element={<ObligationCompliance />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* Hidden routes - accessible via CTA buttons only */}
            <Route path="/intake" element={<IntakePage />} />
            <Route path="/credentialing" element={<CredentialingPage />} />
            <Route path="/integrity" element={<IntegrityPage />} />
            <Route path="/rates" element={<RatesPage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/renewals" element={<RenewalsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
