import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, MessagesSquare, ListTodo, MoonStar, FileText, Settings, CreditCard, Search, GitCommit, CalendarDays } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";
import { Badge } from "./ui/badge";
import { useWorkspaceStats } from "@/lib/workspace-stats";

const bottomItems = [
  { title: "Settings", url: "/app/settings", icon: Settings },
  { title: "Billing",  url: "/app/billing",  icon: CreditCard },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { chatsCount, openActionsCount, noActivityCount, loading } = useWorkspaceStats();

  const isActive = (url: string, end?: boolean) =>
    end ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const items: {
    title: string; url: string; icon: typeof LayoutDashboard;
    end?: boolean; badge?: string;
  }[] = [
    { title: "Dashboard",    url: "/app",              icon: LayoutDashboard, end: true },
    { title: "Chats",        url: "/app/chats",        icon: MessagesSquare,
      badge: loading ? undefined : String(chatsCount ?? 0) },
    { title: "Action Items", url: "/app/actions",      icon: ListTodo,
      badge: loading ? undefined : String(openActionsCount ?? 0) },
    { title: "Commitments",  url: "/app/commitments",  icon: GitCommit },
    { title: "No Activity",  url: "/app/no-activity",  icon: MoonStar,
      badge: loading ? undefined : String(noActivityCount ?? 0) },
    { title: "Summaries",    url: "/app/summaries",    icon: FileText },
    { title: "Search",       url: "/app/search",       icon: Search },
    { title: "Calendar",    url: "/app/calendar",    icon: CalendarDays },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <NavLink to="/app" className="flex items-center gap-2">
          <Logo showText={!collapsed} className="text-sidebar-foreground [&_span]:text-white" />
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/60">Workspace</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.end)} tooltip={item.title}>
                    <NavLink to={item.url} end={item.end} className="group">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {item.badge !== undefined && item.badge !== "0" && (
                            <Badge variant="secondary" className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <NavLink to={item.url}>
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
