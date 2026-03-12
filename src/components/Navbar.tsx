import { Building2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import UserMenu from "@/components/UserMenu";
import ModeSwitcher from "@/components/ModeSwitcher";

const Navbar = () => {
  const location = useLocation();
  const { user, role } = useAuth();

  // Show mode switcher on dashboards and listings page, not on active flows
  const showModeSwitcher =
    user &&
    role !== "manager" &&
    (location.pathname.startsWith("/dashboard/tenant") ||
      location.pathname.startsWith("/dashboard/subtenant") ||
      location.pathname === "/listings");

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">SubletSafe</span>
        </Link>

        {/* Center: Mode Switcher */}
        {showModeSwitcher && <ModeSwitcher />}

        {/* Right: User Menu */}
        <div className="flex items-center gap-3">
          <UserMenu />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
