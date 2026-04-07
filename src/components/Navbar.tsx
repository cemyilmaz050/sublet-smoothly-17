import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import useHasPublishedListing from "@/hooks/useHasPublishedListing";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";
import Logo from "@/components/Logo";

const Navbar = () => {
  const location = useLocation();
  const { user, role } = useAuth();
  const { hasListing } = useHasPublishedListing();
  const [scrolled, setScrolled] = useState(false);
  const [navVisible, setNavVisible] = useState(true);

  const isHomePage = location.pathname === "/";

  useEffect(() => {
    let lastScroll = 0;
    const handleScroll = () => {
      const current = window.scrollY;
      if (isHomePage) {
        setScrolled(current > window.innerHeight * 0.8);
      }
      // Hide/show navbar on scroll
      if (current > lastScroll && current > 80) {
        setNavVisible(false);
      } else {
        setNavVisible(true);
      }
      lastScroll = current;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  const isTransparent = isHomePage && !scrolled;
  const logoVariant = isTransparent ? "light" : "dark";

  // Determine which center links to show based on role/auth state
  const renderCenterLinks = () => {
    const linkClass = (active: boolean) =>
      `text-[15px] font-medium transition-colors ${
        active
          ? "text-primary"
          : isTransparent
            ? "text-white/80 hover:text-white"
            : "text-muted-foreground hover:text-foreground"
      }`;

    if (!user) {
      // Logged out: just "Browse apartments"
      return (
        <Link to="/listings" className={linkClass(location.pathname === "/listings")}>
          Browse apartments
        </Link>
      );
    }

    if (role === "tenant" || hasListing) {
      // Tenant: "My listing"
      return (
        <>
          <Link to="/dashboard/tenant" className={linkClass(location.pathname.includes("/dashboard/tenant"))}>
            My listing
          </Link>
          <Link to="/listings" className={linkClass(location.pathname === "/listings")}>
            Browse
          </Link>
        </>
      );
    }

    // Renter/subtenant: "Browse" and "My offers"
    return (
      <>
        <Link to="/listings" className={linkClass(location.pathname === "/listings")}>
          Browse
        </Link>
        <Link to="/dashboard/subtenant" className={linkClass(location.pathname.includes("/dashboard/subtenant"))}>
          My offers
        </Link>
      </>
    );
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] w-full transition-all duration-300 ease-in-out"
      style={{
        transform: navVisible ? "translateY(0)" : "translateY(-100%)",
        ...(isTransparent
          ? { background: "transparent" }
          : {
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 1px 12px rgba(0,0,0,0.08)",
            }),
      }}
    >
      <div className="flex h-16 items-center justify-between px-6 w-full">
        {/* Left: Logo */}
        <Link to={user ? "/listings" : "/"} className="flex items-center">
          <Logo variant={logoVariant} />
        </Link>

        {/* Center: Role-based nav links (desktop only) */}
        {!isHomePage && (
          <div className="hidden sm:flex items-center gap-8">
            {renderCenterLinks()}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {user && !isHomePage && <NotificationBell />}
          {!user ? (
            <>
              <Link to="/login">
                <button
                  className={`hidden sm:block rounded-full border px-5 py-2 text-[15px] font-semibold transition-colors ${
                    isTransparent
                      ? "border-white/40 text-white hover:bg-white/10"
                      : "border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Log in
                </button>
              </Link>
              <Link to="/signup">
                <button
                  className={`hidden sm:block rounded-full px-5 py-2 text-[15px] font-semibold transition-colors ${
                    isTransparent
                      ? "bg-white text-[#1a1008] hover:bg-white/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  Sign up
                </button>
              </Link>
            </>
          ) : null}
          <UserMenu />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
