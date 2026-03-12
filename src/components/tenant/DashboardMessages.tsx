import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Paperclip, Send, ArrowLeft, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  listing_id: string | null;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  other_name: string;
  other_initial: string;
  listing_address?: string;
  listing_headline?: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface Props {
  conversations: Conversation[];
  unreadCount: number;
  autoOpenConversationId?: string;
}

const DashboardMessages = ({ conversations, unreadCount, autoOpenConversationId }: Props) => {
  const { user } = useAuth();
  const [openConvo, setOpenConvo] = useState<Conversation | null>(null);

  // Auto-open conversation from URL param
  useEffect(() => {
    if (autoOpenConversationId && conversations.length > 0 && !openConvo) {
      const found = conversations.find((c) => c.id === autoOpenConversationId);
      if (found) setOpenConvo(found);
    }
  }, [autoOpenConversationId, conversations]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openConvo) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at, read")
        .eq("conversation_id", openConvo.id)
        .order("created_at", { ascending: true }) as any;
      setMessages(data || []);
      // Mark unread as read
      await supabase.from("messages").update({ read: true }).eq("conversation_id", openConvo.id).neq("sender_id", user?.id || "");
    };
    fetchMessages();

    const channel = supabase
      .channel(`convo-${openConvo.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${openConvo.id}` }, (payload: any) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [openConvo, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || !openConvo || !user) return;
    setSending(true);
    await supabase.from("messages").insert({
      conversation_id: openConvo.id,
      sender_id: user.id,
      content: newMsg.trim(),
    });
    setNewMsg("");
    setSending(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 172800000) return "Yesterday";
    return d.toLocaleDateString("en-US", { weekday: "short" });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground">Messages</h2>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-xs">{unreadCount}</Badge>
          )}
        </div>
        
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No messages yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Applicants who are interested in your listing will message you here.
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border bg-card">
          {conversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => setOpenConvo(convo)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
            >
              {convo.unread_count > 0 && <div className="h-2 w-2 shrink-0 rounded-full bg-cyan" />}
              {convo.unread_count === 0 && <div className="h-2 w-2 shrink-0" />}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {convo.other_initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${convo.unread_count > 0 ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                    {convo.other_name}
                  </p>
                  <span className="text-xs text-muted-foreground">{formatTime(convo.last_message_at)}</span>
                </div>
                {convo.listing_address && (
                  <p className="text-[10px] text-muted-foreground">re: {convo.listing_address}</p>
                )}
                <p className={`mt-0.5 text-xs truncate ${convo.unread_count > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {convo.last_message || "Start a conversation"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Message Panel */}
      <Sheet open={!!openConvo} onOpenChange={(o) => !o && setOpenConvo(null)}>
        <SheetContent className="flex w-full flex-col p-0 sm:max-w-lg">
          {/* Header */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <button onClick={() => setOpenConvo(null)}>
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {openConvo?.other_initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{openConvo?.other_name}</p>
              {openConvo?.listing_address && (
                <p className="text-[10px] text-muted-foreground">re: {openConvo.listing_address}</p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    {msg.content}
                    <p className={`mt-1 text-[10px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <button className="text-muted-foreground hover:text-foreground">
                <Paperclip className="h-5 w-5" />
              </button>
              <Input
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Write a message..."
                className="flex-1"
              />
              <Button size="icon" onClick={handleSend} disabled={!newMsg.trim() || sending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DashboardMessages;
