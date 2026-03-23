import { LayoutDashboard, List, MessageSquare, Users, CalendarDays, FileText, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import Logo from "@/components/Logo";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/tenant/dashboard", icon: LayoutDashboard },
  { title: "My Listings", url: "/tenant/listings", icon: List },
  { title: "Messages", url: "/tenant/messages", icon: MessageSquare },
  { title: "Applicants", url: "/tenant/applicants", icon: Users },
  { title: "Calendar", url: "/tenant/calendar", icon: CalendarDays },
  { title: "Documents", url: "/tenant/documents", icon: FileText },
  { title: "Settings", url: "/tenant/settings", icon: Settings },
];

const TenantSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4">
          {collapsed ? (
            <Logo className="h-7 w-auto" />
          ) : (
            <Logo className="h-8 w-auto" />
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/tenant/dashboard"}
                        className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent ${
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-[3px] before:rounded-r before:bg-sidebar-primary"
                            : "text-sidebar-foreground"
                        }`}
                        activeClassName=""
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default TenantSidebar;
