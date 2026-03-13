import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import useHasPublishedListing from "@/hooks/useHasPublishedListing";
import UserMenu from "@/components/UserMenu";
import SubletFlowOverlay from "@/components/sublet-flow/SubletFlowOverlay";
import logo from "@/assets/subletrooms-logo.png";

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
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="SubletRooms" className="h-8 w-8" />
              <span className="text-xl font-bold"><span className="text-primary">Sub</span><span className="text-foreground">In</span></span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSubletClick}
              className="hidden text-sm font-semibold text-primary transition-colors hover:text-primary/80 sm:block"
            >
              {user && hasListing ? "Go to Your Listings" : "Sublet Your Apartment"}
            </button>
            <UserMenu />
          </div>
        </div>
      </nav>

      <SubletFlowOverlay open={subletOpen} onClose={() => setSubletOpen(false)} />
    </>
  );
};

export default Navbar;
