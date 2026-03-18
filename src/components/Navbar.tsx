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
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();
  const { hasListing } = useHasPublishedListing();
  const [subletOpen, setSubletOpen] = useState(false);
  const [preScreenOpen, setPreScreenOpen] = useState(false);
  const [friendFlowOpen, setFriendFlowOpen] = useState(false);

  const isListingsActive = location.pathname === "/listings";
  const isHowItWorksActive = location.pathname === "/about";

  return (
    <>
      <nav className="sticky top-0 z-[100] border-b bg-card/95 backdrop-blur-lg w-full">
        <div className="flex h-16 items-center justify-between px-6 w-full">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link to={user ? "/listings" : "/"} className="flex items-center">
              <img src={logo} alt="SubIn" className="h-10" />
            </Link>
          </div>

          {/* Center: Nav links (desktop) */}
          <div className="hidden sm:flex items-center gap-8">
            <Link
              to="/listings"
              className={`text-sm font-medium transition-colors ${isListingsActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              Listings
            </Link>
            <Link
              to="/about"
              className={`text-sm font-medium transition-colors ${isHowItWorksActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              How It Works
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            {!user ? (
              <>
                <Link to="/signup">
                  <button className="hidden sm:block rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                    Sign Up
                  </button>
                </Link>
                <Link to="/login">
                  <button className="hidden sm:block rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                    Log In
                  </button>
                </Link>
              </>
            ) : (
              <UserMenu />
            )}
            {/* Mobile: show UserMenu for hamburger */}
            {!user && <div className="sm:hidden"><UserMenu /></div>}
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
