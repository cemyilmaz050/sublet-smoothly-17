import { Building2, Info, LogIn, Search, UserPlus, X, Zap } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const closeAndRun = (action: () => void) => {
    onClose();
    action();
  };

  const handleNavigate = (path: string) => {
    closeAndRun(() => {
      if (path.startsWith("#")) {
        const targetId = path.replace("#", "");

        if (location.pathname === "/") {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
            return;
          }
        }

        navigate(`/${path}`);
        return;
      }

      navigate(path);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        className="absolute inset-0 bg-black/50"
      />

      <div className="relative z-[10000] rounded-t-[20px] bg-card px-0 pb-10 pt-4 shadow-elevated">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close mobile menu"
          className="absolute right-4 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

        {[
          { label: "How It Works", path: "#how-it-works", icon: Info },
          { label: "Browse Listings", path: "/discover", icon: Search },
          { label: "Urgent Sublets", path: "/urgent-landing", icon: Zap, amber: true },
          { label: "Log In", path: "/login", icon: LogIn },
          { label: "Sign Up", path: "/signup", icon: UserPlus },
          { label: "Property Manager", path: "/signup?role=manager", icon: Building2 },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleNavigate(item.path)}
            className={`flex min-h-[56px] w-full items-center gap-4 border-b border-border px-6 text-left text-base font-medium transition-colors hover:bg-accent active:bg-accent ${
              (item as any).amber ? "text-amber-600" : "text-foreground"
            }`}
          >
            <item.icon className={`h-5 w-5 shrink-0 ${(item as any).amber ? "text-amber-500" : "text-muted-foreground"}`} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileMenu;
