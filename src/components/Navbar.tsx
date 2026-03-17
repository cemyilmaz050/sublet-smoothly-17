import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import useHasPublishedListing from "@/hooks/useHasPublishedListing";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";
import SubletFlowOverlay from "@/components/sublet-flow/SubletFlowOverlay";
import FriendSubletPreScreen from "@/components/FriendSubletPreScreen";
import FriendSubletFlow from "@/components/FriendSubletFlow";
import logo from "@/assets/subin-logo.png";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { requireAuth } = useAuthModal();
  const { hasListing } = useHasPublishedListing();
  const [subletOpen, setSubletOpen] = useState(false);
  const [preScreenOpen, setPreScreenOpen] = useState(false);
  const [friendFlowOpen, setFriendFlowOpen] = useState(false);

  const isOnTenantDashboard = location.pathname.startsWith("/tenant/dashboard") || location.pathname.startsWith("/dashboard/tenant");

  const handleSubletClick = () => {
    if (!user) {
      requireAuth(() => {
        if (hasListing) {
          navigate("/tenant/dashboard");
        } else {
          setPreScreenOpen(true);
        }
      });
      return;
    }
    if (hasListing) {
      navigate("/tenant/dashboard");
    } else {
      setPreScreenOpen(true);
    }
  };

  // Determine button label and action
  const getNavAction = () => {
    if (user && hasListing && isOnTenantDashboard) {
      return { label: "Browse as Sub-lessee", onClick: () => navigate("/listings") };
    }
    return { label: "Sublet Your Apartment", onClick: handleSubletClick };
  };

  const navAction = getNavAction();

  return (
    <>
      <nav className="sticky top-0 z-[100] border-b bg-card/80 backdrop-blur-lg w-full">
        <div className="flex h-16 items-center justify-between px-6 w-full">
          <div className="flex items-center gap-3">
            <Link to={user ? "/listings" : "/"} className="flex items-center">
              <img src={logo} alt="SubIn" className="h-11" />
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={navAction.onClick}
              className="hidden sm:block rounded-full px-3 py-1.5 text-sm font-semibold text-foreground transition-all duration-150 ease-in-out hover:bg-[#F3F4F6]"
            >
              {navAction.label}
            </button>
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* Pre-screen: "Do you have someone in mind?" */}
      {preScreenOpen && (
        <FriendSubletPreScreen
          onFriend={() => { setPreScreenOpen(false); setFriendFlowOpen(true); }}
          onMarketplace={() => { setPreScreenOpen(false); setSubletOpen(true); }}
        />
      )}

      <FriendSubletFlow open={friendFlowOpen} onClose={() => setFriendFlowOpen(false)} />
      <SubletFlowOverlay open={subletOpen} onClose={() => setSubletOpen(false)} />
    </>
  );
};

export default Navbar;
