import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardMessages from "@/components/tenant/DashboardMessages";

const ManagerMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (convos?.length) {
      const enriched = await Promise.all(
        convos.map(async (c: any) => {
          const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
          const { data: profile } = await supabase.from("profiles_public" as any).select("first_name, last_name").eq("id", otherId).maybeSingle() as { data: { first_name: string | null; last_name: string | null } | null };
          const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "User";
          const { data: lastMsg } = await supabase.from("messages").select("content, read, sender_id, created_at").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1);
          const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", c.id).eq("read", false).neq("sender_id", user.id);

          let listingHeadline = "";
          let listingAddress = "";
          if (c.listing_id) {
            const { data: l } = await supabase.from("listings").select("headline, address").eq("id", c.listing_id).maybeSingle();
            listingHeadline = l?.headline || "";
            listingAddress = l?.address || "";
          }

          return {
            ...c,
            other_id: otherId,
            other_name: name,
            other_initial: name.charAt(0).toUpperCase(),
            last_message: lastMsg?.[0]?.content || "",
            last_message_time: lastMsg?.[0]?.created_at || c.last_message_at,
            unread_count: count || 0,
            listing_headline: listingHeadline,
            listing_address: listingAddress,
          };
        })
      );
      setConversations(enriched);
      setUnreadCount(enriched.reduce((s: number, c: any) => s + c.unread_count, 0));
    } else {
      setConversations([]);
      setUnreadCount(0);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("mgr-msgs-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchConversations())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchConversations]);

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {loading ? (
        <div className="space-y-3">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : (
        <DashboardMessages conversations={conversations} unreadCount={unreadCount} />
      )}
    </div>
  );
};

export default ManagerMessages;
