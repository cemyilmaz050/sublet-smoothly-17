import { Building2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import UserMenu from "@/components/UserMenu";
import SubletFlowOverlay from "@/components/sublet-flow/SubletFlowOverlay";

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [subletOpen, setSubletOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SubletSafe</span>
          </Link>


          {/* Right: Sublet button + User Menu */}
          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => setSubletOpen(true)}
                className="hidden text-sm font-semibold text-primary transition-colors hover:text-primary/80 sm:block"
              >
                Sublet Your Apartment
              </button>
            )}
            <UserMenu />
          </div>
        </div>
      </nav>

      <SubletOnboardingOverlay open={subletOpen} onClose={() => setSubletOpen(false)} />
    </>
  );
};

export default Navbar;
