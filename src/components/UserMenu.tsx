import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, HelpCircle, LogIn, LogOut, Menu, MessageSquare, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MobileMenu from "@/components/MobileMenu";

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState<string>("");

  useEffect(() => {
    if (!user) {
      setAvatarUrl(null);
      setInitials("");
      return;
    }

    const meta = user.user_metadata || {};
    const first = (meta.first_name || meta.full_name?.split(" ")[0] || "").charAt(0).toUpperCase();
    const last = (meta.last_name || meta.full_name?.split(" ").slice(-1)[0] || "").charAt(0).toUpperCase();
    setInitials(first + last || user.email?.charAt(0).toUpperCase() || "U");

    supabase
      .from("profiles")
      .select("avatar_url, first_name, last_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_url) setAvatarUrl(data.avatar_url);
        if (data?.first_name || data?.last_name) {
          setInitials(((data.first_name || "").charAt(0) + (data.last_name || "").charAt(0)).toUpperCase());
        }
      });
  }, [user]);

  useEffect(() => {
    if (isMobile) return;

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobile]);

  const closeMenu = () => setOpen(false);

  const closeAndNavigate = (path: string) => {
    closeMenu();
    navigate(path);
  };

  const handleHelpCenter = () => {
    closeMenu();
    toast("Help Center coming soon");
  };

  const handleSignOut = async () => {
    closeMenu();
    await signOut();
    navigate("/");
  };

  const menuItemClass =
    "flex min-h-[56px] w-full items-center gap-3 px-4 text-left text-sm text-foreground transition-colors hover:bg-accent";

  const guestMenuItems = (
    <div className="flex flex-col py-1">
      <button type="button" onClick={handleHelpCenter} className={menuItemClass}>
        <HelpCircle className="h-4 w-4 text-muted-foreground" /> Help Center
      </button>
      <div className="mx-4 border-t" />
      <button type="button" onClick={() => closeAndNavigate("/")} className={menuItemClass}>
        <Gift className="h-4 w-4 text-muted-foreground" /> Refer a Sublet
      </button>
      <div className="mx-4 border-t" />
      <button type="button" onClick={() => closeAndNavigate("/login")} className={menuItemClass}>
        <LogIn className="h-4 w-4 text-muted-foreground" /> Log In
      </button>
      <div className="mx-4 border-t" />
      <button type="button" onClick={() => closeAndNavigate("/signup?role=manager")} className={menuItemClass}>
        <User className="h-4 w-4 text-muted-foreground" /> Are you a Property Manager?
      </button>
    </div>
  );

  const authedMenuItems = (
    <div className="flex flex-col py-1">
      <button type="button" onClick={() => closeAndNavigate("/dashboard")} className={menuItemClass}>
        <User className="h-4 w-4 text-muted-foreground" /> My Dashboard
      </button>
      <div className="mx-4 border-t" />
      <button type="button" onClick={() => closeAndNavigate("/messages")} className={menuItemClass}>
        <MessageSquare className="h-4 w-4 text-muted-foreground" /> Messages
      </button>
      <div className="mx-4 border-t" />
      <button type="button" onClick={() => closeAndNavigate("/")} className={menuItemClass}>
        <Gift className="h-4 w-4 text-muted-foreground" /> Refer a Sublet
      </button>
      <div className="mx-4 border-t" />
      <button type="button" onClick={handleHelpCenter} className={menuItemClass}>
        <HelpCircle className="h-4 w-4 text-muted-foreground" /> Help Center
      </button>
      <div className="mx-4 border-t" />
      <button
        type="button"
        onClick={handleSignOut}
        className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" /> Sign Out
      </button>
    </div>
  );

  const triggerButton = user ? (
    <button
      type="button"
      onClick={() => setOpen((prev) => !prev)}
      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border bg-card shadow-sm transition-all duration-150 ease-in-out hover:bg-accent hover:shadow-md"
      aria-label="Open menu"
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="text-sm font-semibold text-foreground">{initials}</span>
      )}
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setOpen((prev) => !prev)}
      className="flex h-10 w-10 items-center justify-center rounded-full border bg-card shadow-sm transition-all duration-150 ease-in-out hover:bg-accent hover:shadow-md"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5 text-foreground" />
    </button>
  );

  return (
    <>
      <div ref={ref} className="relative">
        {triggerButton}

        {!isMobile && (
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border bg-card shadow-elevated"
              >
                {user ? authedMenuItems : guestMenuItems}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {isMobile && !user && <MobileMenu isOpen={open} onClose={closeMenu} />}
    </>
  );
};

export default UserMenu;
