import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const ModeSwitcher = () => {
  const { user, activeMode, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!user) return null;

  const currentMode = location.pathname.includes("/dashboard/tenant")
    ? "tenant"
    : location.pathname.includes("/dashboard/subtenant")
    ? "subtenant"
    : activeMode || "subtenant";

  const switchMode = async (mode: "tenant" | "subtenant") => {
    if (mode === currentMode) return;
    await supabase.from("profiles").update({ active_mode: mode } as any).eq("id", user.id);
    await refreshProfile();
    navigate(mode === "tenant" ? "/dashboard/tenant" : "/dashboard/subtenant");
  };

  return (
    <div className="flex items-center rounded-full border bg-muted/50 p-0.5">
      <button
        onClick={() => switchMode("tenant")}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
          currentMode === "tenant"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span>🏠</span>
        {!isMobile && <span>My Listings</span>}
      </button>
      <button
        onClick={() => switchMode("subtenant")}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
          currentMode === "subtenant"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <span>🔍</span>
        {!isMobile && <span>Find a Place</span>}
      </button>
    </div>
  );
};

export default ModeSwitcher;
