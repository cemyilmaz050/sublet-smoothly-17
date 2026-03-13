import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import useHasPublishedListing from "@/hooks/useHasPublishedListing";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";
import SubletFlowOverlay from "@/components/sublet-flow/SubletFlowOverlay";
import logo from "@/assets/subin-logo.png";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { requireAuth } = useAuthModal();
  const { hasListing } = useHasPublishedListing();
  const [subletOpen, setSubletOpen] = useState(false);

  const isOnTenantDashboard = location.pathname.startsWith("/tenant/dashboard") || location.pathname.startsWith("/dashboard/tenant");

  const handleSubletClick = () => {
    if (!user) {
      requireAuth(() => {
        if (hasListing) {
          navigate("/tenant/dashboard");
        } else {
          setSubletOpen(true);
        }
      });
      return;
    }
    if (hasListing) {
      navigate("/tenant/dashboard");
    } else {
      setSubletOpen(true);
    }
  };

  // Determine button label and action
  const getNavAction = () => {
    if (user && hasListing && isOnTenantDashboard) {
      return { label: "Browse as Sub-lessee", onClick: () => navigate("/") };
    }
    if (user && hasListing) {
      return { label: "Go to Your Listings", onClick: handleSubletClick };
    }
    return { label: "Sublet Your Apartment", onClick: handleSubletClick };
  };

  const navAction = getNavAction();

  return (
    <>
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg w-full">
        <div className="flex h-16 items-center justify-between px-6 w-full">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="SubIn" className="h-8" />
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={navAction.onClick}
              className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-foreground transition-all duration-150 ease-in-out hover:bg-[#F3F4F6] sm:block"
            >
              {navAction.label}
            </button>
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </nav>

      <SubletFlowOverlay open={subletOpen} onClose={() => setSubletOpen(false)} />
    </>
  );
};

export default Navbar;
