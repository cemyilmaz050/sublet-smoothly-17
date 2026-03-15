import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Knock {
  id: string;
  listing_id: string;
  knocker_id: string;
  conversation_id: string | null;
  responded: boolean;
  dismissed: boolean;
  created_at: string;
  knocker_name: string;
  knocker_first_name: string;
  knocker_avatar: string | null;
  listing_headline: string | null;
  listing_address: string | null;
}

/* ─── Gradient avatar colours by initial ─── */
const gradients: Record<string, string> = {
  A: "from-primary to-cyan", B: "from-coral to-amber",
  C: "from-emerald to-cyan", D: "from-primary to-coral",
  E: "from-amber to-coral", F: "from-cyan to-primary",
  G: "from-coral to-primary", H: "from-emerald to-primary",
};
const getGradient = (name: string) => {
  const k = name.charAt(0).toUpperCase();
  return gradients[k] || "from-primary to-accent";
};

const KnocksSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [knocks, setKnocks] = useState<Knock[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const fetchKnocks = async (isRealtime = false) => {
    if (!user) return;
    const { data } = await supabase
      .from("knocks" as any)
      .select("*")
      .eq("tenant_id", user.id)
      .eq("dismissed", false)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      setKnocks([]);
      setLoading(false);
      return;
    }

    const knockerIds = [...new Set((data as any[]).map((k: any) => k.knocker_id))];
    const listingIds = [...new Set((data as any[]).map((k: any) => k.listing_id))];

    const [profilesRes, listingsRes] = await Promise.all([
      supabase.from("profiles_public" as any).select("id, first_name, last_name, avatar_url").in("id", knockerIds),
      supabase.from("listings").select("id, headline, address").in("id", listingIds),
    ]);

    const profileMap: Record<string, any> = {};
    ((profilesRes.data as any[]) || []).forEach((p: any) => { profileMap[p.id] = p; });
    const listingMap: Record<string, any> = {};
    ((listingsRes.data as any[]) || []).forEach((l: any) => { listingMap[l.id] = l; });

    const prevIds = new Set(knocks.map((k) => k.id));

    const enriched = (data as any[]).map((k: any) => {
      const profile = profileMap[k.knocker_id];
      const listing = listingMap[k.listing_id];
      const firstName = profile?.first_name || "Someone";
      return {
        ...k,
        knocker_name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Someone" : "Someone",
        knocker_first_name: firstName,
        knocker_avatar: profile?.avatar_url || null,
        listing_headline: listing?.headline || "Untitled",
        listing_address: listing?.address || "",
      };
    });

    // Track new knock IDs for slide-in animation
    if (isRealtime) {
      const incoming = new Set(enriched.filter((k: any) => !prevIds.has(k.id)).map((k: any) => k.id));
      setNewIds(incoming);
      setTimeout(() => setNewIds(new Set()), 400);
    }

    setKnocks(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchKnocks(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("knocks-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "knocks" }, () => fetchKnocks(true))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleMessage = async (knock: Knock) => {
    if (knock.conversation_id) {
      await supabase.from("knocks" as any).update({ responded: true }).eq("id", knock.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user!.id)
        .single();

      await supabase.from("notifications").insert({
        user_id: knock.knocker_id,
        title: "Your knock worked!",
        message: `${profile?.first_name || "The sublessor"} responded to your knock`,
        type: "knock_response",
        link: `/messages?conversation=${knock.conversation_id}`,
      });

      navigate(`/messages?conversation=${knock.conversation_id}`);
    } else {
      toast.error("No conversation found.");
    }
  };

  const handleDismiss = async (knockId: string) => {
    await supabase.from("knocks" as any).update({ dismissed: true }).eq("id", knockId);
    setKnocks((prev) => prev.filter((k) => k.id !== knockId));
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading || knocks.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center gap-2.5">
        <h3 className="text-base font-bold text-foreground">Knocks</h3>
        <Badge className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{knocks.length}</Badge>
      </div>
      <div className="space-y-3">
        {knocks.map((knock) => {
          const initial = knock.knocker_name.charAt(0).toUpperCase();
          const grad = getGradient(knock.knocker_name);
          const isNew = newIds.has(knock.id);

          return (
            <div
              key={knock.id}
              className={cn(
                "group flex items-start gap-3.5 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-elevated",
                isNew && "animate-slide-in-down"
              )}
            >
              {/* Gradient avatar */}
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-primary-foreground shadow-sm",
                grad
              )}>
                {knock.knocker_avatar ? (
                  <img src={knock.knocker_avatar} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  initial
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  <span className="font-bold">{knock.knocker_name}</span>{" "}
                  <span className="text-muted-foreground">knocked on</span>{" "}
                  <span className="font-semibold">{knock.listing_headline}</span>
                </p>
                {knock.listing_address && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{knock.listing_address}</p>
                )}
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" /> {formatTime(knock.created_at)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 pt-0.5">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-bold rounded-lg shadow-sm"
                  onClick={() => handleMessage(knock)}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Message {knock.knocker_first_name}
                </Button>
                <button
                  onClick={() => handleDismiss(knock.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default KnocksSection;
