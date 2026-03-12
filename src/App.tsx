import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import ListingsPage from "./pages/ListingsPage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
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
import CreateListingPage from "./pages/CreateListingPage";
import ManagerIntegrationsPage from "./pages/ManagerIntegrationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/listings" element={<ListingsPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/tenant" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/subtenant" element={<ProtectedRoute><SubtenantDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
            <Route path="/listings/create" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
            <Route path="/listings/edit/:id" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/pricing-setup" element={<ProtectedRoute><PricingSetupPage /></ProtectedRoute>} />
            <Route path="/payments/summary" element={<ProtectedRoute><PaymentSummaryPage /></ProtectedRoute>} />
            <Route path="/payments/confirmation" element={<ProtectedRoute><PaymentConfirmationPage /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><SubtenantPaymentsPage /></ProtectedRoute>} />
            <Route path="/earnings" element={<ProtectedRoute><TenantEarningsPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
