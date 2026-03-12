import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "./pages/LandingPage";
import ListingsPage from "./pages/ListingsPage";
import SignUpPage from "./pages/SignUpPage";
import DashboardPage from "./pages/DashboardPage";
import TenantDashboard from "./pages/TenantDashboard";
import SubtenantDashboard from "./pages/SubtenantDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import MessagesPage from "./pages/MessagesPage";
import PricingSetupPage from "./pages/PricingSetupPage";
import PaymentSummaryPage from "./pages/PaymentSummaryPage";
import PaymentConfirmationPage from "./pages/PaymentConfirmationPage";
import SubtenantPaymentsPage from "./pages/SubtenantPaymentsPage";
import TenantEarningsPage from "./pages/TenantEarningsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/tenant" element={<TenantDashboard />} />
          <Route path="/dashboard/subtenant" element={<SubtenantDashboard />} />
          <Route path="/dashboard/manager" element={<ManagerDashboard />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/pricing-setup" element={<PricingSetupPage />} />
          <Route path="/payments/summary" element={<PaymentSummaryPage />} />
          <Route path="/payments/confirmation" element={<PaymentConfirmationPage />} />
          <Route path="/payments" element={<SubtenantPaymentsPage />} />
          <Route path="/earnings" element={<TenantEarningsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
