import { Outlet, NavLink } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Bell, LogOut, User, Building2 } from "lucide-react";

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border bg-card px-4 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex items-center gap-2 ml-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Select defaultValue="acme">
                <SelectTrigger className="w-[200px] h-9 border-none shadow-none font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acme">Acme Affiliates</SelectItem>
                  <SelectItem value="growth">Growth Media</SelectItem>
                  <SelectItem value="new">+ New workspace</SelectItem>
                </SelectContent>
              </Select>
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
                      <AvatarFallback className="gradient-primary text-primary-foreground text-xs">JD</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium">Jordan D.</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="text-sm font-medium">Jordan Davis</div>
                    <div className="text-xs text-muted-foreground">jordan@acme.io</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><NavLink to="/app/settings"><User className="h-4 w-4 mr-2" />Profile</NavLink></DropdownMenuItem>
                  <DropdownMenuItem asChild><NavLink to="/app/billing"><User className="h-4 w-4 mr-2" />Billing</NavLink></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><NavLink to="/login"><LogOut className="h-4 w-4 mr-2" />Sign out</NavLink></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
