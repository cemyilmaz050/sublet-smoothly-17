import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthModalProvider } from "@/hooks/useAuthModal";
import AuthModal from "@/components/AuthModal";
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
import CreateListingPage from "./pages/CreateListingPage";
import ManagerIntegrationsPage from "./pages/ManagerIntegrationsPage";
import ManagerSubletRequestsPage from "./pages/ManagerSubletRequestsPage";
import ManagerPropertiesPage from "./pages/ManagerPropertiesPage";
import ManagerActiveSublets from "./pages/ManagerActiveSublets";
import TenantOnboardingPage from "./pages/TenantOnboardingPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ManagerProfilePage from "./pages/ManagerProfilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AuthModalProvider>
            <AuthModal />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<ListingsPage />} />
              <Route path="/listings" element={<ListingsPage />} />
              <Route path="/about" element={<LandingPage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/sign-up" element={<SignUpPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              <Route path="/managers/:slug" element={<ManagerProfilePage />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/subtenant/onboarding" element={<ProtectedRoute><TenantOnboardingPage /></ProtectedRoute>} />
              <Route path="/dashboard/tenant" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
              <Route path="/tenant/dashboard" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/subtenant" element={<ProtectedRoute><SubtenantDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
              <Route path="/dashboard/manager/integrations" element={<ProtectedRoute><ManagerIntegrationsPage /></ProtectedRoute>} />
              <Route path="/dashboard/manager/requests" element={<ProtectedRoute><ManagerSubletRequestsPage /></ProtectedRoute>} />
              <Route path="/dashboard/manager/properties" element={<ProtectedRoute><ManagerPropertiesPage /></ProtectedRoute>} />
              <Route path="/dashboard/manager/sublets" element={<ProtectedRoute><ManagerActiveSublets /></ProtectedRoute>} />
              <Route path="/listings/create" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
              <Route path="/listings/edit/:id" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthModalProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
