import { useState, useEffect, useCallback, useRef } from "react";
import { MessageSquare, ArrowLeft, Send, Search, Smile, DoorOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Conversation {
  id: string;
  listing_id: string | null;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  other_name: string;
  other_initial: string;
  other_id: string;
  listing_address: string;
  listing_headline: string;
  listing_photo: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

// Gradient backgrounds for avatars
const AVATAR_GRADIENTS = [
  "from-indigo-400 to-purple-500",
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-rose-500",
  "from-cyan-400 to-blue-500",
  "from-pink-400 to-fuchsia-500",
  "from-amber-400 to-orange-500",
];

const getGradient = (name: string) => {
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
};

const formatTime = (ts: string) => {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatMsgTime = (ts: string) => {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const MessagesPage = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (convos && convos.length > 0) {
      const enriched = await Promise.all(
        convos.map(async (c: any) => {
          const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;

          const { data: profile } = await supabase
            .from("profiles_public" as any)
            .select("first_name, last_name, avatar_url")
            .eq("id", otherId)
            .maybeSingle() as any;

          const otherFirstName = profile?.first_name || "User";
          const otherLastName = profile?.last_name || "";
          const otherName = otherLastName ? `${otherFirstName} ${otherLastName}` : otherFirstName;

          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, read, sender_id, created_at")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", c.id)
            .eq("read", false)
            .neq("sender_id", user.id) as any;

          let listingHeadline = "";
          let listingAddress = "";
          let listingPhoto: string | null = null;
          if (c.listing_id) {
            const { data: l } = await supabase
              .from("listings")
              .select("headline, address, photos")
              .eq("id", c.listing_id)
              .maybeSingle() as any;
            listingHeadline = l?.headline || "";
            listingAddress = l?.address || "";
            listingPhoto = l?.photos?.[0] || null;
          }

          return {
            ...c,
            other_id: otherId,
            other_name: otherName,
            other_initial: otherFirstName.charAt(0).toUpperCase(),
            last_message: lastMsg?.[0]?.content || "",
            last_message_time: lastMsg?.[0]?.created_at || c.last_message_at,
            unread_count: count || 0,
            listing_headline: listingHeadline,
            listing_address: listingAddress,
            listing_photo: listingPhoto,
          };
        })
      );
      setConversations(enriched);
    } else {
      setConversations([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-page-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => fetchConversations())
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => fetchConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchConversations]);

  // Auto-open from URL
  const autoOpenId = searchParams.get("conversation");
  useEffect(() => {
    if (autoOpenId && conversations.length > 0 && !activeConvo) {
      const found = conversations.find((c) => c.id === autoOpenId);
      if (found) setActiveConvo(found);
    }
  }, [autoOpenId, conversations]);

  // Fetch messages when active convo changes
  useEffect(() => {
    if (!activeConvo) { setMessages([]); return; }
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at, read")
        .eq("conversation_id", activeConvo.id)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      // Mark as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", activeConvo.id)
        .neq("sender_id", user?.id || "");
    };
    fetchMessages();

    const channel = supabase
      .channel(`convo-${activeConvo.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeConvo.id}` }, (payload: any) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        // Mark incoming as read immediately
        if (payload.new.sender_id !== user?.id) {
          supabase.from("messages").update({ read: true }).eq("id", payload.new.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeConvo, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConvo || !user) return;
    setSending(true);
    await supabase.from("messages").insert({
      conversation_id: activeConvo.id,
      sender_id: user.id,
      content: newMsg.trim(),
    });
    setNewMsg("");
    setSending(false);
    inputRef.current?.focus();
  };

  const filteredConvos = searchQuery
    ? conversations.filter(
        (c) =>
          c.other_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.listing_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.listing_headline.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const unreadCount = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  // ─── INBOX LIST ────────────────────────────────────────
  const InboxList = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-muted/50 border-0 text-[16px]"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-1 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-3">
                <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConvos.length === 0 && conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
              <DoorOpen className="h-8 w-8 text-primary" />
            </div>
            <p className="text-base font-semibold text-foreground">No messages yet</p>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-[240px]">
              Knock on a listing to start a conversation
            </p>
          </div>
        ) : filteredConvos.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">No conversations match your search</p>
          </div>
        ) : (
          <div className="p-1.5">
            {filteredConvos.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setActiveConvo(convo)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                  activeConvo?.id === convo.id
                    ? "bg-primary/[0.08]"
                    : "hover:bg-muted/60"
                )}
              >
                {/* Unread dot */}
                <div className="w-2.5 shrink-0 flex justify-center">
                  {convo.unread_count > 0 && (
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </div>

                {/* Avatar */}
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-sm font-bold",
                  getGradient(convo.other_name)
                )}>
                  {convo.other_initial}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "text-sm truncate",
                      convo.unread_count > 0 ? "font-bold text-foreground" : "font-medium text-foreground"
                    )}>
                      {convo.other_name}
                    </p>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {formatTime(convo.last_message_time || convo.last_message_at)}
                    </span>
                  </div>
                  {(convo.listing_headline || convo.listing_address) && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {convo.listing_headline || convo.listing_address}
                    </p>
                  )}
                  <p className={cn(
                    "text-xs truncate mt-0.5",
                    convo.unread_count > 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}>
                    {convo.last_message || "Start a conversation"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ─── CHAT THREAD ───────────────────────────────────────
  const ChatThread = () => {
    if (!activeConvo) {
      // Desktop empty state
      return (
        <div className="flex h-full flex-col items-center justify-center text-center px-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">Select a conversation</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a conversation from the left to start chatting
          </p>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b px-4 py-3 shrink-0">
          {isMobile && (
            <button onClick={() => setActiveConvo(null)} className="p-1 -ml-1 shrink-0">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
          )}
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-sm font-bold",
            getGradient(activeConvo.other_name)
          )}>
            {activeConvo.other_initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{activeConvo.other_name}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {activeConvo.listing_headline || activeConvo.listing_address || "Direct message"}
            </p>
          </div>
          {activeConvo.listing_photo && (
            <img
              src={activeConvo.listing_photo}
              alt=""
              className="h-10 w-14 rounded-lg object-cover shrink-0 border"
            />
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <p className="text-sm text-muted-foreground">
                Say hello to get the conversation started 👋
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const isMine = msg.sender_id === user?.id;
                const showTime = idx === messages.length - 1 ||
                  messages[idx + 1]?.sender_id !== msg.sender_id ||
                  new Date(messages[idx + 1]?.created_at).getTime() - new Date(msg.created_at).getTime() > 300000;

                return (
                  <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                    <div className="max-w-[75%]">
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      {showTime && (
                        <p className={cn(
                          "text-[10px] mt-1 mb-2 px-1",
                          isMine ? "text-right text-muted-foreground" : "text-muted-foreground"
                        )}>
                          {formatMsgTime(msg.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="shrink-0 border-t bg-card px-3 py-3 safe-bottom">
          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <Smile className="h-5 w-5" />
            </button>
            <input
              ref={inputRef}
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type a message..."
              className="flex-1 rounded-full border bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              style={{ fontSize: "16px" }}
            />
            <button
              onClick={handleSend}
              disabled={!newMsg.trim() || sending}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all",
                newMsg.trim()
                  ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── LAYOUT ────────────────────────────────────────────

  // Mobile: show inbox or chat
  if (isMobile) {
    return (
      <div className="h-[calc(100dvh-64px)] bg-background">
        <AnimatePresence mode="wait">
          {activeConvo ? (
            <motion.div
              key="chat"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
              className="h-full"
            >
              <ChatThread />
            </motion.div>
          ) : (
            <motion.div
              key="inbox"
              initial={{ opacity: 0.9 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.9 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <InboxList />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop: split pane
  return (
    <div className="h-[calc(100dvh-64px)] bg-background flex">
      {/* Left — Inbox */}
      <div className="w-[360px] shrink-0 border-r flex flex-col">
        <InboxList />
      </div>

      {/* Right — Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatThread />
      </div>
    </div>
  );
};

export default MessagesPage;
