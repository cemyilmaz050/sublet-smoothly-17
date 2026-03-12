import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, MessageSquare, Bell, Heart, Settings, Globe, DollarSign, LogOut, ChevronRight, X, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Portuguese",
  "Mandarin", "Arabic", "Italian", "Japanese", "Korean",
];

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc" },
];

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [currOpen, setCurrOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("English");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const ref = useRef<HTMLDivElement>(null);

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

  const menuItems = (
    <div className="flex flex-col">
      {/* Section A: Communication */}
      <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Communication</p>
      <button onClick={() => handleNav("/messages")} className="flex items-center justify-between px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent">
        <span className="flex items-center gap-2.5"><MessageSquare className="h-4 w-4" /> Messages</span>
        <Badge variant="outline" className="h-5 min-w-[20px] justify-center bg-primary text-primary-foreground text-[10px] px-1.5">2</Badge>
      </button>
      <button onClick={() => handleNav("/notifications")} className="flex items-center justify-between px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent">
        <span className="flex items-center gap-2.5"><Bell className="h-4 w-4" /> Notifications</span>
        <Badge variant="outline" className="h-5 min-w-[20px] justify-center bg-primary text-primary-foreground text-[10px] px-1.5">3</Badge>
      </button>

      <div className="mx-4 my-1 border-t" />

      {/* Section B: Account */}
      <p className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
      <button onClick={() => handleNav("/wishlist")} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent">
        <Heart className="h-4 w-4" /> Wishlist
      </button>
      <button onClick={() => handleNav("/settings")} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent">
        <Settings className="h-4 w-4" /> Account Settings
      </button>

      <div className="mx-4 my-1 border-t" />

      {/* Section C: Preferences */}
      <p className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preferences</p>
      <button onClick={() => { setOpen(false); setLangOpen(true); }} className="flex items-center justify-between px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent">
        <span className="flex items-center gap-2.5"><Globe className="h-4 w-4" /> Language</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">{selectedLang} <ChevronRight className="h-3 w-3" /></span>
      </button>
      <button onClick={() => { setOpen(false); setCurrOpen(true); }} className="flex items-center justify-between px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent">
        <span className="flex items-center gap-2.5"><DollarSign className="h-4 w-4" /> Currency</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">{selectedCurrency} <ChevronRight className="h-3 w-3" /></span>
      </button>

      <div className="mx-4 my-1 border-t" />

      <button onClick={handleSignOut} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10">
        <LogOut className="h-4 w-4" /> Sign Out
      </button>
      <div className="h-2" />
    </div>
  );

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Sign In</Button>
        <Button size="sm" onClick={() => navigate("/signup")}>Get Started</Button>
      </div>
    );
  }

  return (
    <>
      <div ref={ref} className="relative">
        {/* Pill trigger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-full border bg-card px-2 py-1.5 shadow-sm transition-shadow hover:shadow-md"
        >
          <Menu className="h-4 w-4 text-foreground" />
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            {user.user_metadata?.first_name?.[0]?.toUpperCase() || <User className="h-3.5 w-3.5" />}
          </div>
        </button>

        {/* Desktop dropdown */}
        {!isMobile && (
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-xl border bg-card shadow-elevated z-50"
              >
                {menuItems}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-8">
            {menuItems}
          </SheetContent>
        </Sheet>
      )}

      {/* Language modal */}
      <Dialog open={langOpen} onOpenChange={setLangOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Language</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 pt-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => { setSelectedLang(lang); setLangOpen(false); }}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                  selectedLang === lang ? "border-primary bg-accent text-primary" : "hover:bg-accent"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Currency modal */}
      <Dialog open={currOpen} onOpenChange={setCurrOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Select Currency</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 pt-2">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => { setSelectedCurrency(c.code); setCurrOpen(false); }}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors ${
                  selectedCurrency === c.code ? "bg-accent text-primary font-semibold" : "hover:bg-accent"
                }`}
              >
                <span>{c.label}</span>
                <span className="text-muted-foreground">{c.symbol} {c.code}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserMenu;
