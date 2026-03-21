import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import ContractDeviation from "./pages/ContractDeviation";
import StandardClauses from "./pages/StandardClauses";
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
import UserManagement from "./pages/UserManagement";
import ContractsPage from "./pages/ContractsPage";
import ContractViewerPage from "./pages/ContractViewerPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem("oci_logged_in") === "true");

  const handleLogin = (userId: string) => {
    setLoggedIn(true);
    window.dispatchEvent(new Event("oci_user_changed"));
  };

  const handleLogout = () => {
    localStorage.removeItem("oci_logged_in");
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <LoginPage onLogin={handleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AppLayout onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/create" element={<ContractCreation />} />
              <Route path="/upload" element={<UploadContract />} />
              <Route path="/digitization" element={<DigitizationPage />} />
              <Route path="/deviation" element={<ContractDeviation />} />
              <Route path="/clauses" element={<StandardClauses />} />
              <Route path="/redlining" element={<Redlining />} />
              <Route path="/agents" element={<AgentWorkspace />} />
              <Route path="/workflow" element={<WorkflowPage />} />
              <Route path="/downstream" element={<DownstreamFeed />} />
              <Route path="/compliance" element={<ObligationCompliance />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/contracts/:id" element={<ContractViewerPage />} />
              <Route path="/users" element={<UserManagement />} />
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
};

export default App;
