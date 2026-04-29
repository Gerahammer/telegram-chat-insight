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

// API returns: { user: { id, name, email, avatarUrl }, company: { id, name, slug, plan }, role }
interface MeResponse {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  company?: {
    name?: string;
    slug?: string;
    plan?: string;
  };
  role?: string;
}

function initials(name?: string, email?: string): string {
  const src = name?.trim() || email?.split("@")[0] || "";
  if (!src) return "U";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

// Module-level cache so /api/auth/me is only called once per app load
let mePromise: Promise<MeResponse | null> | null = null;
let meCache: MeResponse | null = null;

function loadMe(): Promise<MeResponse | null> {
  if (meCache) return Promise.resolve(meCache);
  if (mePromise) return mePromise;
  mePromise = (async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (!res.ok) return null;
      const data = (await res.json()) as MeResponse;
      meCache = data;
      return data;
    } catch {
      return null;
    }
  })();
  return mePromise;
}

export default function AppLayout() {
  const [me, setMe] = useState<MeResponse | null>(meCache);

  useEffect(() => {
    if (meCache) return;
    let cancelled = false;
    loadMe().then((data) => {
      if (!cancelled && data) setMe(data);
    });
    return () => { cancelled = true; };
  }, []);

  // Correct field mapping for our API response shape
  const fullName = me?.user?.name || me?.user?.email?.split("@")[0] || "";
  const shortName = fullName.split(" ").slice(0, 2).join(" ") || "Account";
  const workspaceName = me?.company?.name || "My workspace";
  const email = me?.user?.email ?? "";

  const handleSignOut = () => {
    clearAuthToken();
    meCache = null;
    mePromise = null;
    window.location.href = "/login";
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
                      <NavLink to="/app/settings"><User className="h-4 w-4 mr-2" />Settings</NavLink>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />Sign out
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
