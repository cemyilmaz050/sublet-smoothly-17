import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, HelpCircle, Gift, LogIn, MessageSquare, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { requireAuth } = useAuthModal();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState<string>("");

  useEffect(() => {
    if (!user) { setAvatarUrl(null); setInitials(""); return; }
    // Get initials from user metadata
    const meta = user.user_metadata || {};
    const first = (meta.first_name || meta.full_name?.split(" ")[0] || "").charAt(0).toUpperCase();
    const last = (meta.last_name || meta.full_name?.split(" ").slice(-1)[0] || "").charAt(0).toUpperCase();
    setInitials(first + last || user.email?.charAt(0).toUpperCase() || "U");
    // Fetch avatar from profile
    supabase.from("profiles").select("avatar_url, first_name, last_name").eq("id", user.id).single().then(({ data }) => {
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
      if (data?.first_name || data?.last_name) {
        setInitials(((data.first_name || "").charAt(0) + (data.last_name || "").charAt(0)).toUpperCase() || initials);
      }
    });
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNav = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate("/");
  };

  const menuItemClass =
    "flex items-center gap-2.5 px-4 py-3 text-sm text-foreground transition-colors hover:bg-accent w-full text-left";

  const guestMenuItems = (
    <div className="flex flex-col py-1">
      <button onClick={() => { setOpen(false); }} className={menuItemClass}>
        <HelpCircle className="h-4 w-4 text-muted-foreground" /> Help Center
      </button>
      <div className="mx-4 border-t" />
      <button onClick={() => { setOpen(false); navigate("/refer"); }} className={menuItemClass}>
        <Gift className="h-4 w-4 text-muted-foreground" /> Refer a Sublet
      </button>
      <div className="mx-4 border-t" />
      <button onClick={() => { setOpen(false); requireAuth(); }} className={menuItemClass}>
        <LogIn className="h-4 w-4 text-muted-foreground" /> Log In or Sign Up
      </button>
      <div className="mx-4 border-t" />
      <button onClick={() => handleNav("/manager")} className={menuItemClass}>
        <User className="h-4 w-4 text-muted-foreground" /> Are you a Property Manager?
      </button>
    </div>
  );

  const authedMenuItems = (
    <div className="flex flex-col py-1">
      <button onClick={() => handleNav("/dashboard")} className={menuItemClass}>
        <User className="h-4 w-4 text-muted-foreground" /> My Dashboard
      </button>
      <div className="mx-4 border-t" />
      <button onClick={() => handleNav("/messages")} className={menuItemClass}>
        <MessageSquare className="h-4 w-4 text-muted-foreground" /> Messages
      </button>
      <div className="mx-4 border-t" />
      <button onClick={() => { setOpen(false); navigate("/refer"); }} className={menuItemClass}>
        <Gift className="h-4 w-4 text-muted-foreground" /> Refer a Sublet
      </button>
      <div className="mx-4 border-t" />
      <button onClick={() => { setOpen(false); }} className={menuItemClass}>
        <HelpCircle className="h-4 w-4 text-muted-foreground" /> Help Center
      </button>
      <div className="mx-4 border-t" />
      <button onClick={handleSignOut} className="flex items-center gap-2.5 px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/10 w-full text-left">
        <LogOut className="h-4 w-4" /> Sign Out
      </button>
    </div>
  );

  const menuContent = user ? authedMenuItems : guestMenuItems;

  const triggerButton = (
    <button
      onClick={() => setOpen(!open)}
      className="flex h-10 w-10 items-center justify-center rounded-full border bg-card shadow-sm transition-all duration-150 ease-in-out hover:bg-[#F3F4F6] hover:shadow-md"
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
                className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border bg-card shadow-elevated z-50"
              >
                {menuContent}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {isMobile && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8">
            {menuContent}
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

export default UserMenu;
