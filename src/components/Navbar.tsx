import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
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
  const [subletOpen, setSubletOpen] = useState(false);
  const [preScreenOpen, setPreScreenOpen] = useState(false);
  const [friendFlowOpen, setFriendFlowOpen] = useState(false);

  const handleSubletClick = () => {
    if (!user) {
      requireAuth(() => setPreScreenOpen(true));
      return;
    }
    setPreScreenOpen(true);
  };

  return (
    <>
      <nav className="sticky top-0 z-[100] border-b bg-card/80 backdrop-blur-lg w-full">
        <div className="flex h-16 items-center justify-between px-6 w-full">
          {/* Left: Logo */}
          <Link to={user ? "/listings" : "/"} className="flex items-center">
            <img src={logo} alt="SubIn" className="h-11" />
          </Link>

          {/* Center: Nav links */}
          <div className="hidden sm:flex items-center gap-6">
            <Link
              to="/listings"
              className={`text-sm font-medium transition-colors hover:text-foreground ${location.pathname === "/listings" ? "text-foreground" : "text-muted-foreground"}`}
            >
              Listings
            </Link>
            <Link
              to="/#how-it-works"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
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
