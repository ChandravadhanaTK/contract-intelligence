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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/upload" replace />} />
            <Route path="/upload" element={<UploadContract />} />
            <Route path="/deviation" element={<ContractDeviation />} />
            <Route path="/clauses" element={<StandardClauses />} />
            <Route path="/create" element={<ContractCreation />} />
            <Route path="/agents" element={<AgentWorkspace />} />
            <Route path="/redlining" element={<Redlining />} />
            <Route path="/workflow" element={<WorkflowPage />} />
            <Route path="/downstream" element={<DownstreamFeed />} />
            <Route path="/compliance" element={<ObligationCompliance />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
