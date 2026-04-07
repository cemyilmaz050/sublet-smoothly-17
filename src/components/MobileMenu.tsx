import { LogIn, Search, UserPlus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    setTimeout(() => navigate(path), 50);
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
          { label: "Browse apartments", path: "/listings", icon: Search },
          { label: "Log in", path: "/login", icon: LogIn },
          { label: "Sign up", path: "/signup", icon: UserPlus },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => handleNavigate(item.path)}
            className="flex min-h-[56px] w-full items-center gap-4 border-b border-border px-6 text-left text-[15px] font-medium text-foreground transition-colors hover:bg-accent active:bg-accent"
          >
            <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileMenu;
