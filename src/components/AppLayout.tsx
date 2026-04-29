import { Outlet, NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Bell, LogOut, User, Building2 } from "lucide-react";
import { apiFetch, clearAuthToken } from "@/lib/api";
import { WorkspaceStatsProvider } from "@/lib/workspace-stats";

interface MeResponse {
  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  workspace?: { name?: string };
  workspaceName?: string;
}

function initials(name?: string, email?: string): string {
  const src = name?.trim() || email?.split("@")[0] || "";
  if (!src) return "U";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export default function AppLayout() {
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/auth/me");
        if (!res.ok) return;
        const data = (await res.json()) as MeResponse;
        if (!cancelled) setMe(data);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const fullName =
    me?.fullName ||
    me?.name ||
    [me?.firstName, me?.lastName].filter(Boolean).join(" ").trim() ||
    me?.email?.split("@")[0] ||
    "";
  const shortName = fullName.split(" ").slice(0, 2).join(" ") || "Account";
  const workspaceName = me?.workspace?.name || me?.workspaceName || "My workspace";
  const email = me?.email ?? "";

  const handleSignOut = () => {
    clearAuthToken();
  };

  return (
    <SidebarProvider>
     <WorkspaceStatsProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border bg-card px-4 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex items-center gap-2 ml-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{workspaceName}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="gradient-primary text-primary-foreground text-xs">
                        {initials(fullName, email)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">{shortName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="text-sm font-medium">{fullName || "Account"}</div>
                    {email && <div className="text-xs text-muted-foreground">{email}</div>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavLink to="/app/settings"><User className="h-4 w-4 mr-2" />Profile</NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to="/app/billing"><User className="h-4 w-4 mr-2" />Billing</NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild onClick={handleSignOut}>
                    <NavLink to="/login"><LogOut className="h-4 w-4 mr-2" />Sign out</NavLink>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
     </WorkspaceStatsProvider>
    </SidebarProvider>
  );
}
