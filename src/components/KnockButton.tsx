import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import VideoPrompt from "@/components/video/VideoPrompt";

/* ─── Custom SVG Icons ─── */
const FistIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4C10 2.9 10.9 2 12 2C13.1 2 14 2.9 14 4V8H10V4Z" fill="currentColor" opacity="0.85" />
    <path d="M7 6C7 5.17 7.67 4.5 8.5 4.5C9.33 4.5 10 5.17 10 6V9H7V6Z" fill="currentColor" opacity="0.9" />
    <path d="M14 6C14 5.17 14.67 4.5 15.5 4.5C16.33 4.5 17 5.17 17 6V9H14V6Z" fill="currentColor" opacity="0.9" />
    <path d="M5 9C5 8.17 5.67 7.5 6.5 7.5C7.33 7.5 8 8.17 8 9V12H5V9Z" fill="currentColor" opacity="0.8" />
    <path d="M5 12H19C19 12 20 12.5 20 14V16C20 19.31 17.31 22 14 22H12C8.13 22 5 18.87 5 15V12Z" fill="currentColor" />
  </svg>
);

const FlameIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1C8 1 3 6 3 10C3 12.76 5.24 15 8 15C10.76 15 13 12.76 13 10C13 6 8 1 8 1Z" fill="url(#flame-grad)" />
    <path d="M8 7C8 7 6 9.5 6 11C6 12.1 6.9 13 8 13C9.1 13 10 12.1 10 11C10 9.5 8 7 8 7Z" fill="#FFF3" />
    <defs>
      <linearGradient id="flame-grad" x1="8" y1="1" x2="8" y2="15" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FF6B6B" /><stop offset="1" stopColor="#EE3E64" />
      </linearGradient>
    </defs>
  </svg>
);

interface KnockButtonProps {
  listingId: string;
  tenantId: string;
  listingHeadline?: string | null;
  listingAddress?: string | null;
  knockCount?: number;
  compact?: boolean;
  className?: string;
}

const KnockButton = ({ listingId, tenantId, listingHeadline, listingAddress, knockCount = 0, compact = false, className }: KnockButtonProps) => {
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();
  const [knocked, setKnocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(knockCount);
  const [showRipple, setShowRipple] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showVideoPrompt, setShowVideoPrompt] = useState(false);
  const [hasIntroVideo, setHasIntroVideo] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("knocks" as any).select("id").eq("listing_id", listingId).eq("knocker_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setKnocked(true); });
  }, [user, listingId]);

  useEffect(() => { setCount(knockCount); }, [knockCount]);

  const performKnock = async () => {
    if (!user || knocked || loading) return;
    if (user.id === tenantId) return;

    setLoading(true);
    try {
      let conversationId: string | null = null;
      const { data: existingConvo } = await supabase.from("conversations").select("id").eq("listing_id", listingId)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`).maybeSingle();

      if (existingConvo) { conversationId = existingConvo.id; } else {
        const { data: newConvo } = await supabase.from("conversations")
          .insert({ participant_1: user.id, participant_2: tenantId, listing_id: listingId })
          .select("id").single();
        conversationId = newConvo?.id ?? null;
      }

      const { error } = await supabase.from("knocks" as any).insert({
        listing_id: listingId, knocker_id: user.id, tenant_id: tenantId, conversation_id: conversationId,
      });

      if (error) {
        if (error.code === "23505") { setKnocked(true); toast.info("You already knocked on this one!"); }
        else throw error;
        return;
      }

      setShaking(true);
      setTimeout(() => { setShaking(false); setShowRipple(true); }, 500);
      setTimeout(() => { setShowRipple(false); setConfirming(true); setKnocked(true); setCount((c) => c + 1); }, 1300);
      setTimeout(() => setConfirming(false), 1650);

      const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("id", user.id).single();
      const knockerName = profile?.first_name ? `${profile.first_name} ${profile.last_name || ""}`.trim() : "Someone";

      await supabase.from("notifications").insert({
        user_id: tenantId,
        title: "Someone knocked on your listing!",
        message: `${knockerName} is interested in your place at ${listingAddress || listingHeadline || "your apartment"}`,
        type: "knock", link: "/dashboard/tenant",
      });

      supabase.functions.invoke("send-notification-email", {
        body: {
          to: tenantId,
          subject: `${knockerName} wants your place!`,
          type: "knock",
          data: {
            knocker_name: knockerName,
            listing_title: listingHeadline || "your apartment",
            listing_address: listingAddress || "",
            message_url: `${window.location.origin}/messages${conversationId ? `?conversation=${conversationId}` : ""}`,
            profile_url: `${window.location.origin}/dashboard/tenant`,
          },
        },
      }).catch(() => {});

      toast.success("Knock sent! The host will be notified.");
    } catch (err) {
      console.error("Knock error:", err);
      toast.error("Couldn't send your knock. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleKnock = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) { requireAuth(() => handleKnock()); return; }
    if (knocked || loading) return;
    if (user.id === tenantId) return;

    // No verification gate for knocking — knock freely
    performKnock();
  };

  if (user && user.id === tenantId) return null;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)} onClick={(e) => e.stopPropagation()}>
        <button ref={btnRef} onClick={handleKnock} disabled={knocked || loading}
          className={cn(
            "group/knock relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 overflow-visible",
            knocked ? "bg-muted text-muted-foreground cursor-default" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm active:scale-95"
          )}>
          {showRipple && (
            <>
              <span className="absolute inset-0 rounded-full border-2 border-primary animate-knock-ripple-1 pointer-events-none" />
              <span className="absolute inset-0 rounded-full border-2 border-primary animate-knock-ripple-2 pointer-events-none" />
              <span className="absolute inset-0 rounded-full border border-primary animate-knock-ripple-3 pointer-events-none" />
            </>
          )}
          <FistIcon className={cn("h-3.5 w-3.5 shrink-0 transition-transform", !knocked && "group-hover/knock:animate-knock-shake", shaking && "animate-knock-shake")} />
          <span className={cn(confirming && "animate-knock-confirm")}>{knocked ? "Knocked ✓" : "Knock"}</span>
          {!knocked && count > 0 && (
            <span className="ml-0.5 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-semibold leading-none">{count}</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} onClick={(e) => e.stopPropagation()}>
      <button ref={btnRef} onClick={handleKnock} disabled={knocked || loading}
        className={cn(
          "group/knock relative flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all duration-200 overflow-visible",
          knocked ? "bg-muted text-muted-foreground cursor-default animate-knock-confirm" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg active:scale-[0.98]"
        )}>
        {showRipple && (
          <>
            <span className="absolute inset-0 rounded-xl border-2 border-primary animate-knock-ripple-1 pointer-events-none" />
            <span className="absolute inset-0 rounded-xl border-2 border-primary animate-knock-ripple-2 pointer-events-none" />
            <span className="absolute inset-0 rounded-xl border border-primary animate-knock-ripple-3 pointer-events-none" />
          </>
        )}
        <FistIcon className={cn("h-5 w-5 shrink-0 transition-transform", !knocked && "group-hover/knock:animate-knock-shake", shaking && "animate-knock-shake")} />
        <span>{knocked ? "Knocked ✓" : "Knock"}</span>
        {!knocked && count > 0 && (
          <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs font-semibold leading-none">{count}</span>
        )}
      </button>
    </div>
  );
};

export const KnockActivity = ({ knockCount, className }: { knockCount: number; className?: string }) => {
  if (knockCount < 1) return null;
  return (
    <div className={cn("flex items-center gap-2 mt-1.5", className)}>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-coral opacity-75 animate-pulse-dot" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-coral" />
        </span>
        {knockCount} {knockCount === 1 ? "person" : "people"} interested
      </span>
      {knockCount >= 10 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-coral to-destructive px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
          <FlameIcon className="h-3 w-3 animate-flame-flicker" />
          Hot listing
        </span>
      )}
    </div>
  );
};

export default KnockButton;
