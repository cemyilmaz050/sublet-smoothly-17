import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import useHasPublishedListing from "@/hooks/useHasPublishedListing";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";
import SubletFlowOverlay from "@/components/sublet-flow/SubletFlowOverlay";
import FriendSubletPreScreen from "@/components/FriendSubletPreScreen";
import FriendSubletFlow from "@/components/FriendSubletFlow";
import Logo from "@/components/Logo";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();
  const { hasListing } = useHasPublishedListing();
  const [subletOpen, setSubletOpen] = useState(false);
  const [preScreenOpen, setPreScreenOpen] = useState(false);
  const [friendFlowOpen, setFriendFlowOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isListingsActive = location.pathname === "/listings";
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    if (!isHomePage) return;
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  const handleHowItWorks = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/#how-it-works");
    } else {
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Determine navbar style
  const isTransparent = isHomePage && !scrolled;
  const logoVariant = isTransparent ? "light" : "dark";

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[100] w-full transition-all duration-300 ease-in-out"
        style={
          isTransparent
            ? { background: "transparent" }
            : {
                background: "rgba(255,255,255,0.97)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 1px 12px rgba(0,0,0,0.08)",
              }
        }
      >
        <div className="flex h-16 items-center justify-between px-6 w-full">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link to={user ? "/listings" : "/"} className="flex items-center">
              <Logo variant={logoVariant} />
            </Link>
          </div>

          {/* Center: Nav links (desktop) — hidden on homepage */}
          {!isHomePage && (
            <div className="hidden sm:flex items-center gap-8">
              <Link
                to="/listings"
                className={`text-sm font-medium transition-colors ${isListingsActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Listings
              </Link>
              <Link
                to="/urgent"
                className="text-sm font-semibold transition-colors text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                ⚡ Urgent
              </Link>
              <a
                href="#how-it-works"
                onClick={handleHowItWorks}
                className="text-sm font-medium transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
              >
                How It Works
              </a>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {!isHomePage && <NotificationBell />}
            {!user ? (
              <>
                <Link to="/login">
                  <button
                    className={`hidden sm:block rounded-full border px-5 py-2 text-sm font-semibold transition-colors ${
                      isTransparent
                        ? "border-white/40 text-white hover:bg-white/10"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    Login
                  </button>
                </Link>
                <Link to="/signup">
                  <button
                    className={`hidden sm:block rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                      isTransparent
                        ? "bg-white text-[#1a1008] hover:bg-white/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    Sign up
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
