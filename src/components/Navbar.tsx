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
import NavLink from "@/components/NavLink";
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

  const handleSubletClick = () => {
    if (!user) {
      requireAuth(() => {
        if (hasListing) navigate("/tenant/dashboard");
        else setPreScreenOpen(true);
      });
      return;
    }
    if (hasListing) navigate("/tenant/dashboard");
    else setPreScreenOpen(true);
  };

  return (
    <>
      <nav className="sticky top-0 z-[100] border-b bg-card/80 backdrop-blur-lg w-full">
        <div className="flex h-16 items-center justify-between px-6 w-full">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <Link to={user ? "/listings" : "/"} className="flex items-center">
              <img src={logo} alt="SubIn" className="h-11" />
            </Link>
          </div>

          {/* Center: Nav links (desktop) */}
          <div className="hidden sm:flex items-center gap-6">
            <Link to="/listings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Listings
            </Link>
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {!user && (
              <>
                <Link to="/signup" className="hidden sm:block rounded-full px-3 py-1.5 text-sm font-semibold text-foreground transition-all hover:bg-muted">
                  Sign Up
                </Link>
                <Link to="/login" className="hidden sm:block rounded-full px-3 py-1.5 text-sm font-semibold text-foreground transition-all hover:bg-muted">
                  Log In
                </Link>
              </>
            )}
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </nav>

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
