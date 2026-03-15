import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/hooks/useAuthModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface KnockButtonProps {
  listingId: string;
  tenantId: string;
  listingHeadline?: string | null;
  listingAddress?: string | null;
  knockCount?: number;
  /** Compact mode for listing cards */
  compact?: boolean;
  className?: string;
}

const KnockButton = ({
  listingId,
  tenantId,
  listingHeadline,
  listingAddress,
  knockCount = 0,
  compact = false,
  className,
}: KnockButtonProps) => {
  const { user } = useAuth();
  const { requireAuth } = useAuthModal();
  const navigate = useNavigate();
  const [knocked, setKnocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(knockCount);

  // Check if user already knocked
  useEffect(() => {
    if (!user) return;
    supabase
      .from("knocks" as any)
      .select("id")
      .eq("listing_id", listingId)
      .eq("knocker_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setKnocked(true);
      });
  }, [user, listingId]);

  // Sync external knockCount
  useEffect(() => {
    setCount(knockCount);
  }, [knockCount]);

  const handleKnock = async (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!user) {
      requireAuth(() => handleKnock());
      return;
    }

    if (knocked || loading) return;
    if (user.id === tenantId) return; // Can't knock your own listing

    setLoading(true);

    try {
      // 1. Create or find conversation (empty — no message sent)
      let conversationId: string | null = null;
      const { data: existingConvo } = await supabase
        .from("conversations")
        .select("id")
        .eq("listing_id", listingId)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .maybeSingle();

      if (existingConvo) {
        conversationId = existingConvo.id;
      } else {
        const { data: newConvo } = await supabase
          .from("conversations")
          .insert({
            participant_1: user.id,
            participant_2: tenantId,
            listing_id: listingId,
          })
          .select("id")
          .single();
        conversationId = newConvo?.id ?? null;
      }

      // 2. Insert knock
      const { error } = await supabase.from("knocks" as any).insert({
        listing_id: listingId,
        knocker_id: user.id,
        tenant_id: tenantId,
        conversation_id: conversationId,
      });

      if (error) {
        if (error.code === "23505") {
          // Already knocked (unique constraint)
          setKnocked(true);
          toast.info("You've already knocked on this listing.");
        } else {
          throw error;
        }
        return;
      }

      setKnocked(true);
      setCount((c) => c + 1);

      // 3. Get knocker's name for notification
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", user.id)
        .single();
      const knockerName = profile?.first_name
        ? `${profile.first_name} ${profile.last_name || ""}`.trim()
        : "Someone";

      // 4. In-app notification
      await supabase.from("notifications").insert({
        user_id: tenantId,
        title: "Someone knocked! 🚪",
        message: `${knockerName} knocked on your listing at ${listingAddress || listingHeadline || "your apartment"}`,
        type: "knock",
        link: "/dashboard/tenant",
      });

      // 5. Email notification (fire and forget)
      supabase.functions
        .invoke("send-notification-email", {
          body: {
            to: tenantId,
            subject: `${knockerName} is interested in your place`,
            type: "knock",
            data: {
              knocker_name: knockerName,
              listing_title: listingHeadline || "your apartment",
              listing_address: listingAddress || "",
              message_url: `${window.location.origin}/messages${conversationId ? `?conversation=${conversationId}` : ""}`,
              profile_url: `${window.location.origin}/dashboard/tenant`,
            },
          },
        })
        .catch(() => {});

      toast.success("Knock sent! 🚪 The sublessor will be notified.");
    } catch (err) {
      console.error("Knock error:", err);
      toast.error("Failed to knock. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Don't show knock button for own listings
  if (user && user.id === tenantId) return null;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <button
          onClick={handleKnock}
          disabled={knocked || loading}
          className={cn(
            "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all",
            knocked
              ? "bg-muted text-muted-foreground cursor-default"
              : "bg-muted/60 text-muted-foreground hover:bg-primary/10 hover:text-primary active:scale-95"
          )}
        >
          {knocked ? "Knocked ✓" : "🚪 Knock"}
        </button>
        {count > 0 && (
          <span className="text-[11px] text-muted-foreground">{count} knock{count !== 1 ? "s" : ""}</span>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "gap-1.5 text-xs",
        knocked && "bg-muted text-muted-foreground border-muted cursor-default",
        className
      )}
      onClick={handleKnock}
      disabled={knocked || loading}
    >
      {knocked ? "Knocked ✓" : "🚪 Knock"}
      {count > 0 && (
        <span className="ml-1 text-[11px] text-muted-foreground">({count})</span>
      )}
    </Button>
  );
};

export default KnockButton;
