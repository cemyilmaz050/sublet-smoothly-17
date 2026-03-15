import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Knock {
  id: string;
  listing_id: string;
  knocker_id: string;
  conversation_id: string | null;
  responded: boolean;
  dismissed: boolean;
  created_at: string;
  knocker_name: string;
  knocker_avatar: string | null;
  listing_headline: string | null;
  listing_address: string | null;
}

const KnocksSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [knocks, setKnocks] = useState<Knock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKnocks = async () => {
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

    // Enrich with knocker profiles and listing info
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

    const enriched = (data as any[]).map((k: any) => {
      const profile = profileMap[k.knocker_id];
      const listing = listingMap[k.listing_id];
      return {
        ...k,
        knocker_name: profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Someone" : "Someone",
        knocker_avatar: profile?.avatar_url || null,
        listing_headline: listing?.headline || "Untitled",
        listing_address: listing?.address || "",
      };
    });

    setKnocks(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchKnocks(); }, [user]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("knocks-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "knocks" }, () => fetchKnocks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleMessage = async (knock: Knock) => {
    if (knock.conversation_id) {
      // Mark as responded
      await supabase.from("knocks" as any).update({ responded: true }).eq("id", knock.id);

      // Notify the knocker that the sublessor responded
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user!.id)
        .single();

      await supabase.from("notifications").insert({
        user_id: knock.knocker_id,
        title: "They responded! 🎉",
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
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">🚪 Knocks</h3>
        <Badge variant="secondary" className="text-xs">{knocks.length}</Badge>
      </div>
      <div className="space-y-2">
        {knocks.map((knock) => (
          <Card key={knock.id} className="shadow-sm">
            <CardContent className="flex items-center gap-3 p-3 sm:p-4">
              {/* Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {knock.knocker_avatar ? (
                  <img src={knock.knocker_avatar} alt="" className="h-full w-full rounded-full object-cover" />
                ) : (
                  knock.knocker_name.charAt(0).toUpperCase()
                )}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{knock.knocker_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  Knocked on {knock.listing_headline}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                  <Clock className="h-3 w-3" /> {formatTime(knock.created_at)}
                </p>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="sm" className="h-8 text-xs gap-1" onClick={() => handleMessage(knock)}>
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground" onClick={() => handleDismiss(knock.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default KnocksSection;
