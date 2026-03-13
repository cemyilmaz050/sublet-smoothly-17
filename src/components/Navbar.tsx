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
