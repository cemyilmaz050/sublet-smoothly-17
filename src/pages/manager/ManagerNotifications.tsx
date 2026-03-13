import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCircle2, Users, AlertTriangle, FileText, MessageSquare, DollarSign, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const ManagerNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["mgr-notifs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const markAllRead = async () => {
    const unread = notifications.filter((n: any) => !n.read).map((n: any) => n.id);
    if (!unread.length) return;
    await supabase.from("notifications").update({ read: true }).in("id", unread);
    queryClient.invalidateQueries({ queryKey: ["mgr-notifs"] });
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["mgr-notifs"] });
  };

  const iconForType = (type: string) => {
    switch (type) {
      case "application": return <Users className="h-4 w-4 text-primary" />;
      case "approval": return <CheckCircle2 className="h-4 w-4 text-emerald" />;
      case "rejection": return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "message": return <MessageSquare className="h-4 w-4 text-cyan" />;
      case "payment": return <DollarSign className="h-4 w-4 text-emerald" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="mr-1 h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Loading...</p>
      ) : notifications.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
            No notifications yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => (
            <Link key={n.id} to={n.link || "#"} onClick={() => !n.read && markRead(n.id)}>
              <Card className={`shadow-card transition-all hover:shadow-elevated ${!n.read ? "border-primary/20 bg-primary/[0.02]" : ""}`}>
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent">
                    {iconForType(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{format(new Date(n.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerNotifications;
