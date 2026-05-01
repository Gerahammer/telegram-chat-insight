import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface Member {
  userId?: string;
  role?: string;
  user?: { name?: string; email?: string };
}

interface MeResponse {
  user?: { name?: string; email?: string };
  company?: { name?: string; slug?: string; plan?: string };
  role?: string;
}

interface WorkspaceSettings {
  summaryTime?: string;
  timezone?: string;
  aiProvider?: string;
  notifyEmail?: boolean;
  retentionDays?: number;
}

const Settings = () => {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<WorkspaceSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingToken, setRefreshingToken] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [meRes, tokenRes, settingsRes] = await Promise.all([
        apiFetch("/api/auth/me").catch(() => null),
        apiFetch("/api/workspaces/current/connection-token").catch(() => null),
        apiFetch("/api/settings").catch(() => null),
      ]);

      if (meRes?.ok) {
        try {
          const data = await meRes.json();
          if (!cancelled) {
            setMe(data);
            // Members come from the company data — use me endpoint for now
            // showing just the current user
            setMembers([{ userId: data.user?.email, role: data.role, user: data.user }]);
          }
        } catch { /* empty */ }
      }

      if (tokenRes?.ok) {
        try {
          const data = await tokenRes.json();
          if (!cancelled) setToken(data?.connectionToken ?? null);
        } catch { /* empty */ }
      }

      if (settingsRes?.ok) {
        try {
          const data = await settingsRes.json();
          if (!cancelled) setSettings(data?.settings ?? {});
        } catch { /* empty */ }
      }

      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshingToken(true);
    try {
      const res = await apiFetch("/api/workspaces/current/refresh-connection-token", { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setToken(data?.connectionToken ?? null);
      toast.success("New token generated");
    } catch {
      toast.error("Failed to refresh token");
    } finally {
      setRefreshingToken(false);
    }
  };

  const workspaceName = me?.company?.name ?? "";
  const workspaceSlug = me?.company?.slug ?? "";
  const userName = me?.user?.name ?? "";
  const userEmail = me?.user?.email ?? "";

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your workspace and AI preferences.</p>
      </div>

      <Tabs defaultValue="workspace">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 h-auto">
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="ai">AI summaries</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {/* Workspace */}
        <TabsContent value="workspace" className="mt-6">
          <Card className="p-6 space-y-4 max-w-xl">
            {loading ? (
              <><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Workspace name</Label>
                  <Input value={workspaceName} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Contact support to change your workspace name.</p>
                </div>
                <div className="space-y-2">
                  <Label>Your name</Label>
                  <Input value={userName} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={userEmail} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <div>
                    <Badge variant="secondary" className="capitalize">{me?.company?.plan?.toLowerCase() ?? "free"}</Badge>
                  </div>
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Team members</h2>
            </div>
            <div className="space-y-2">
              {loading ? (
                <Skeleton className="h-14 w-full" />
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No team members found.</p>
              ) : (
                members.map((m, i) => {
                  const name = m.user?.name ?? m.user?.email ?? "Member";
                  const email = m.user?.email ?? "";
                  const initials = name.split(/\s+/).map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={m.userId ?? i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{initials}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-medium text-sm">{name}</div>
                          {email && <div className="text-xs text-muted-foreground">{email}</div>}
                        </div>
                      </div>
                      {m.role && <Badge variant="secondary" className="capitalize">{m.role.toLowerCase()}</Badge>}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </TabsContent>

        {/* AI Summaries */}
        <TabsContent value="ai" className="mt-6">
          <Card className="p-6 space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label>Daily summary time (UTC)</Label>
              <Select
                value={settings.summaryTime ?? "08:00"}
                onValueChange={(v) => setSettings(s => ({ ...s, summaryTime: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["06:00","07:00","08:00","09:00","10:00","12:00","18:00","20:00"].map(t => (
                    <SelectItem key={t} value={t}>{t} UTC</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={settings.timezone ?? "UTC"}
                onValueChange={(v) => setSettings(s => ({ ...s, timezone: v }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/Berlin">CET (Europe/Berlin)</SelectItem>
                  <SelectItem value="Europe/London">GMT (Europe/London)</SelectItem>
                  <SelectItem value="America/New_York">EST (New York)</SelectItem>
                  <SelectItem value="Asia/Singapore">SGT (Singapore)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Auto-summary interval</Label>
              <Select
                value={String(settings.autoSummaryIntervalMin ?? "30")}
                onValueChange={(v) => setSettings((s: any) => ({ ...s, autoSummaryIntervalMin: parseInt(v) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every hour</SelectItem>
                  <SelectItem value="120">Every 2 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">How often to check for new messages</p>
            </div>
            <div className="space-y-2">
              <Label>Minimum messages to trigger summary</Label>
              <Select
                value={String(settings.minMessagesForSummary ?? "3")}
                onValueChange={(v) => setSettings((s: any) => ({ ...s, minMessagesForSummary: parseInt(v) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 message</SelectItem>
                  <SelectItem value="3">3 messages</SelectItem>
                  <SelectItem value="5">5 messages</SelectItem>
                  <SelectItem value="10">10 messages</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-start justify-between gap-4 py-2">
              <div>
                <Label>Email notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Receive daily summary emails.</p>
              </div>
              <Switch
                checked={settings.notifyEmail ?? true}
                onCheckedChange={(v) => setSettings((s: any) => ({ ...s, notifyEmail: v }))}
              />
            </div>
            <Button className="gradient-primary border-0" onClick={handleSaveSettings} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </Card>
        </TabsContent>

        {/* Data */}
        <TabsContent value="data" className="mt-6">
          <Card className="p-6 space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label>Data retention</Label>
              <Select
                value={String(settings.retentionDays ?? 90)}
                onValueChange={(v) => setSettings(s => ({ ...s, retentionDays: parseInt(v) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Older messages are automatically deleted.</p>
            </div>
            <Button className="gradient-primary border-0" onClick={handleSaveSettings} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
