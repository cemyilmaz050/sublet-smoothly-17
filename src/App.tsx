import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthModalProvider } from "@/hooks/useAuthModal";
import AuthModal from "@/components/AuthModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LandingPage from "./pages/LandingPage";
import ListingsPage from "./pages/ListingsPage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import TenantDashboard from "./pages/TenantDashboard";
import SubtenantDashboard from "./pages/SubtenantDashboard";
import TenantOnboardingPage from "./pages/TenantOnboardingPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ManagerProfilePage from "./pages/ManagerProfilePage";
import MessagesPage from "./pages/MessagesPage";
import CreateListingPage from "./pages/CreateListingPage";
import ReferPage from "./pages/ReferPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AgreementPage from "./pages/AgreementPage";
import PaymentConfirmationPage from "./pages/PaymentConfirmationPage";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

// Manager layout + pages
import ManagerLayout from "./components/manager/ManagerLayout";
import ManagerHome from "./pages/manager/ManagerHome";
import ManagerListings from "./pages/manager/ManagerListings";
import ManagerApplications from "./pages/manager/ManagerApplications";
import ManagerApprovals from "./pages/manager/ManagerApprovals";
import ManagerMessages from "./pages/manager/ManagerMessages";
import ManagerNotifications from "./pages/manager/ManagerNotifications";
import ManagerBackgroundChecks from "./pages/manager/ManagerBackgroundChecks";
import ManagerPayments from "./pages/manager/ManagerPayments";
import ManagerSettings from "./pages/manager/ManagerSettings";

const queryClient = new QueryClient();

/** Persistent navbar shown on all routes except the manager portal */
function PersistentNavbar() {
  const location = useLocation();
  const isManagerRoute = location.pathname.startsWith("/manager");
  if (isManagerRoute) return null;
  return <Navbar />;
}

/** Hide footer on full-screen pages like messages and manager portal */
function PersistentFooter() {
  const location = useLocation();
  if (location.pathname.startsWith("/manager")) return null;
  if (location.pathname.startsWith("/messages")) return null;
  return <Footer />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
        <AuthProvider>
          <AuthModalProvider>
            <AuthModal />
            <div className="flex min-h-screen flex-col">
              <PersistentNavbar />
              <div className="flex-1">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<ListingsPage />} />
                  <Route path="/listings" element={<ListingsPage />} />
                  <Route path="/about" element={<LandingPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/sign-up" element={<SignUpPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/managers/:slug" element={<ManagerProfilePage />} />
                  <Route path="/refer" element={<ReferPage />} />

                  {/* Protected routes */}
                  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                  <Route path="/subtenant/onboarding" element={<ProtectedRoute><TenantOnboardingPage /></ProtectedRoute>} />
                  <Route path="/dashboard/tenant" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
                  <Route path="/tenant/dashboard" element={<ProtectedRoute><TenantDashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/subtenant" element={<ProtectedRoute><SubtenantDashboard /></ProtectedRoute>} />
                  <Route path="/listings/create" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
                  <Route path="/listings/edit/:id" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                  <Route path="/agreement" element={<ProtectedRoute><AgreementPage /></ProtectedRoute>} />
                  <Route path="/payments/confirmation" element={<ProtectedRoute><PaymentConfirmationPage /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

                  {/* Manager Dashboard — unified layout */}
                  <Route path="/manager" element={<ProtectedRoute><ManagerLayout /></ProtectedRoute>}>
                    <Route index element={<ManagerHome />} />
                    <Route path="listings" element={<ManagerListings />} />
                    <Route path="applications" element={<ManagerApplications />} />
                    <Route path="messages" element={<ManagerMessages />} />
                    <Route path="notifications" element={<ManagerNotifications />} />
                    <Route path="checks" element={<ManagerBackgroundChecks />} />
                    <Route path="payments" element={<ManagerPayments />} />
                    <Route path="settings" element={<ManagerSettings />} />
                  </Route>

                  {/* Redirects from old manager routes */}
                  <Route path="/dashboard/manager" element={<Navigate to="/manager" replace />} />
                  <Route path="/dashboard/manager/*" element={<Navigate to="/manager" replace />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <PersistentFooter />
            </div>
          </AuthModalProvider>
        </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;