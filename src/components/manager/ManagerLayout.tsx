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
  ShieldCheck, DollarSign, Settings, LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import bbgLogo from "@/assets/bbg-logo.png";

const navItems = [
  { title: "Dashboard", url: "/manager", icon: LayoutDashboard },
  { title: "Active Sublet Listings", url: "/manager/listings", icon: Building2 },
  { title: "Applications", url: "/manager/applications", icon: Users },
  { title: "Background Checks", url: "/manager/checks", icon: ShieldCheck },
  { title: "Messages", url: "/manager/messages", icon: MessageSquare },
  { title: "Notifications", url: "/manager/notifications", icon: Bell },
  { title: "Payments & Earnings", url: "/manager/payments", icon: DollarSign },
  { title: "Settings", url: "/manager/settings", icon: Settings },
];

function SidebarNav() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

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
                      end={item.url === "/manager"}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
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
  if (!user) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground hidden sm:block">Boston Brokerage Group — Staff</span>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {user.email?.charAt(0).toUpperCase()}
      </div>
    </div>
  );
}
