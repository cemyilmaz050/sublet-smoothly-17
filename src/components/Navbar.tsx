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

  const handleSubletClick = () => {
    if (!user) {
      requireAuth(() => {
        // After auth, re-trigger the sublet flow
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

  return (
    <>
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center">
              <img src={logo} alt="SubIn" className="h-8" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSubletClick}
              className="hidden text-sm font-semibold text-primary transition-colors hover:text-primary/80 sm:block"
            >
              {user && hasListing ? "Go to Your Listings" : "Sublet Your Apartment"}
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
