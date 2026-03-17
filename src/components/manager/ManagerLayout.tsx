import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  LayoutDashboard, Building2, Users, MessageSquare, Bell,
  ShieldCheck, DollarSign, Settings, LogOut, ClipboardCheck, FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import bbgLogo from "@/assets/bbg-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const PORTAL_BASE = "/portal-mgmt-bbg";

const navItems = [
  { title: "Dashboard", url: PORTAL_BASE, icon: LayoutDashboard },
  { title: "Property Catalog", url: `${PORTAL_BASE}/catalog`, icon: Building2 },
  { title: "Pending Approvals", url: `${PORTAL_BASE}/approvals`, icon: ClipboardCheck, badgeKey: "pendingApprovals" as const },
  { title: "Active Sublet Listings", url: `${PORTAL_BASE}/listings`, icon: Building2 },
  { title: "Documents", url: `${PORTAL_BASE}/documents`, icon: FileText },
  { title: "Applications", url: `${PORTAL_BASE}/applications`, icon: Users },
  { title: "Background Checks", url: `${PORTAL_BASE}/checks`, icon: ShieldCheck },
  { title: "Messages", url: `${PORTAL_BASE}/messages`, icon: MessageSquare },
  { title: "Notifications", url: `${PORTAL_BASE}/notifications`, icon: Bell },
  { title: "Payments & Earnings", url: `${PORTAL_BASE}/payments`, icon: DollarSign },
  { title: "Settings", url: `${PORTAL_BASE}/settings`, icon: Settings },
];

function SidebarNav() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuth();

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["manager-pending-count", user?.id],
    enabled: !!user,
    refetchInterval: 30000,
    queryFn: async () => {
      const { count } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("manager_id", user!.id)
        .eq("status", "pending");
      return count ?? 0;
    },
  });

  const { data: docNotifCount = 0 } = useQuery({
    queryKey: ["manager-doc-notif-count", user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("type", "document")
        .eq("read", false);
      return count ?? 0;
    },
  });

  const badges: Record<string, number> = { pendingApprovals: pendingCount, documents: docNotifCount };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <img src={bbgLogo} alt="Boston Brokerage Group" className="h-9 w-9 rounded-lg object-contain" />
            <div>
              <p className="text-sm font-bold text-sidebar-foreground">Boston Brokerage Group</p>
              <p className="text-[11px] text-muted-foreground">Staff Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <img src={bbgLogo} alt="BBG" className="h-9 w-9 rounded-lg object-contain" />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === PORTAL_BASE}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="flex-1">{item.title}</span>}
                      {!collapsed && item.badgeKey && badges[item.badgeKey] > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                          {badges[item.badgeKey]}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        {!collapsed && (
          <NavLink to="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="h-3.5 w-3.5" />
            Back to Platform
          </NavLink>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export default function ManagerLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <SidebarNav />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-card/80 backdrop-blur-lg px-4 lg:px-6">
            <SidebarTrigger />
            <div className="flex-1" />
            <ManagerHeaderUser />
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ManagerHeaderUser() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground hidden sm:block">Boston Brokerage Group · Staff</span>
      <button
        onClick={handleSignOut}
        title="Sign out"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary hover:bg-destructive/10 hover:text-destructive transition-colors"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
