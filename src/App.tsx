import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AuthModalProvider } from "@/hooks/useAuthModal";
import { VerificationPollingProvider } from "@/hooks/useVerificationPolling";
import AuthModal from "@/components/AuthModal";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import ManagerProtectedRoute from "@/components/ManagerProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import Navbar from "@/components/Navbar";
import VerificationPendingBanner from "@/components/VerificationPendingBanner";
import Footer from "@/components/Footer";
import HomePage from "./pages/HomePage";
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
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AgreementPage from "./pages/AgreementPage";
import PaymentConfirmationPage from "./pages/PaymentConfirmationPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCreateListing from "./pages/AdminCreateListing";
import FriendSubletLanding from "./pages/FriendSubletLanding";
import NotFound from "./pages/NotFound";
import BBGDocumentFillingPage from "./pages/BBGDocumentFillingPage";

// Manager layout + pages
import ManagerLayout from "./components/manager/ManagerLayout";
import ManagerHome from "./pages/manager/ManagerHome";
import ManagerCatalog from "./pages/manager/ManagerCatalog";
import ManagerCatalogEditor from "./pages/manager/ManagerCatalogEditor";
import ManagerListings from "./pages/manager/ManagerListings";
import ManagerApplications from "./pages/manager/ManagerApplications";
import ManagerApprovals from "./pages/manager/ManagerApprovals";
import ManagerMessages from "./pages/manager/ManagerMessages";
import ManagerNotifications from "./pages/manager/ManagerNotifications";
import ManagerBackgroundChecks from "./pages/manager/ManagerBackgroundChecks";
import ManagerPayments from "./pages/manager/ManagerPayments";
import ManagerSettings from "./pages/manager/ManagerSettings";
import ManagerDocuments from "./pages/manager/ManagerDocuments";

const queryClient = new QueryClient();

function PersistentNavbar() {
  const location = useLocation();
  const isManagerRoute = location.pathname.startsWith("/manager") || location.pathname.startsWith("/portal-mgmt-bbg");
  const isAdminRoute = location.pathname.startsWith("/admin-subin-2026");
  if (isManagerRoute || isAdminRoute) return null;
  return <Navbar />;
}

function PersistentFooter() {
  const location = useLocation();
  if (location.pathname.startsWith("/manager") || location.pathname.startsWith("/portal-mgmt-bbg")) return null;
  if (location.pathname.startsWith("/messages")) return null;
  if (location.pathname.startsWith("/admin-subin-2026")) return null;
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
          <VerificationPollingProvider>
          <AuthModalProvider>
            <AuthModal />
            <div className="flex min-h-screen flex-col">
              <PersistentNavbar />
              <VerificationPendingBanner />
              <div className="flex-1">
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<HomePage />} />
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
                  <Route path="/invite/friend" element={<FriendSubletLanding />} />

                  {/* Redirect old AI finder route */}
                  <Route path="/find" element={<Navigate to="/listings" replace />} />
                  <Route path="/refer" element={<Navigate to="/" replace />} />

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
                  <Route path="/documents/bbg" element={<ProtectedRoute><BBGDocumentFillingPage /></ProtectedRoute>} />

                  {/* Founder Admin */}
                  <Route path="/admin-subin-2026" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                  <Route path="/admin-subin-2026/create-listing" element={<AdminProtectedRoute><AdminCreateListing /></AdminProtectedRoute>} />

                  {/* Manager Dashboard */}
                  <Route path="/portal-mgmt-bbg" element={<ManagerProtectedRoute><ManagerLayout /></ManagerProtectedRoute>}>
                    <Route index element={<ManagerHome />} />
                    <Route path="catalog" element={<ManagerCatalog />} />
                    <Route path="catalog/:propertyId" element={<ManagerCatalogEditor />} />
                    <Route path="approvals" element={<ManagerApprovals />} />
                    <Route path="listings" element={<ManagerListings />} />
                    <Route path="applications" element={<ManagerApplications />} />
                    <Route path="messages" element={<ManagerMessages />} />
                    <Route path="notifications" element={<ManagerNotifications />} />
                    <Route path="checks" element={<ManagerBackgroundChecks />} />
                    <Route path="payments" element={<ManagerPayments />} />
                    <Route path="documents" element={<ManagerDocuments />} />
                    <Route path="settings" element={<ManagerSettings />} />
                  </Route>

                  <Route path="/manager/*" element={<ManagerProtectedRoute><Navigate to="/portal-mgmt-bbg" replace /></ManagerProtectedRoute>} />
                  <Route path="/manager" element={<ManagerProtectedRoute><Navigate to="/portal-mgmt-bbg" replace /></ManagerProtectedRoute>} />
                  <Route path="/admin" element={<Navigate to="/admin-subin-2026" replace />} />
                  <Route path="/s-admin-console" element={<Navigate to="/listings" replace />} />
                  <Route path="/s-admin-console/*" element={<Navigate to="/listings" replace />} />
                  <Route path="/dashboard/manager" element={<Navigate to="/manager" replace />} />
                  <Route path="/dashboard/manager/*" element={<Navigate to="/manager" replace />} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
              <PersistentFooter />
            </div>
          </AuthModalProvider>
          </VerificationPollingProvider>
        </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
