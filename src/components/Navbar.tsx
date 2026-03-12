import { Building2, ArrowLeft } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import useHasPublishedListing from "@/hooks/useHasPublishedListing";
import UserMenu from "@/components/UserMenu";
import SubletFlowOverlay from "@/components/sublet-flow/SubletFlowOverlay";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { hasListing } = useHasPublishedListing();
  const [subletOpen, setSubletOpen] = useState(false);

  const isTenantBrowsing = role === "tenant" && (location.pathname === "/listings" || location.pathname === "/discover");

  const handleSubletClick = () => {
    if (!user) {
      navigate("/sign-up");
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
          {/* Left: Logo + optional back link */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">SubletSafe</span>
            </Link>
          </div>

          {/* Right: Dynamic sublet/listings button + User Menu */}
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
