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
import { Bot, Copy, RefreshCw, ThumbsDown, Undo2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { TrackerBuilderTab } from "@/components/TrackerBuilder";

interface Member {
  userId?: string;
  role?: string;
  user?: { name?: string; email?: string };
}

interface MeResponse {
  user?: {
    name?: string;
    email?: string;
    telegramUsername?: string | null;
    whatsappHandle?: string | null;
    teamsHandle?: string | null;
  };
  company?: { name?: string; slug?: string; plan?: string };
  role?: string;
}

interface WorkspaceSettings {
  summaryTime?: string;
  timezone?: string;
  aiProvider?: string;
  notifyEmail?: boolean;
  retentionDays?: number;
  autoSummaryIntervalMin?: number;
  minMessagesForSummary?: number;
}

interface FeedbackItem {
  id: string;
  type: string;
  content: string;
  entityId?: string;
  chatId: string;
  chatTitle: string;
  createdAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  link: string;
}

const Settings = () => {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<WorkspaceSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [revealedLink, setRevealedLink] = useState<string | null>(null);

  const [handles, setHandles] = useState<{ telegramUsername: string; whatsappHandle: string; teamsHandle: string }>({
    telegramUsername: "",
    whatsappHandle: "",
    teamsHandle: "",
  });
  const [savingHandles, setSavingHandles] = useState(false);

  const saveHandles = async () => {
    setSavingHandles(true);
    try {
      const res = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          telegramUsername: handles.telegramUsername.trim() || null,
          whatsappHandle: handles.whatsappHandle.trim() || null,
          teamsHandle: handles.teamsHandle.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Sync local state with normalized values from the server (e.g. stripped @).
      setHandles({
        telegramUsername: data?.user?.telegramUsername ?? "",
        whatsappHandle: data?.user?.whatsappHandle ?? "",
        teamsHandle: data?.user?.teamsHandle ?? "",
      });
      setMe(prev => prev ? { ...prev, user: { ...prev.user, ...data.user } } : prev);
      toast.success("Saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingHandles(false);
    }
  };

  const loadMembers = async () => {
    const res = await apiFetch("/api/workspaces/current/members").catch(() => null);
    if (res?.ok) {
      try {
        const data = await res.json();
        setMembers(data.members ?? []);
      } catch { /* empty */ }
    }
  };

  const loadInvites = async () => {
    const res = await apiFetch("/api/invites").catch(() => null);
    if (res?.ok) {
      try {
        const data = await res.json();
        setInvites(data.invites ?? []);
      } catch { /* empty */ }
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await apiFetch("/api/invites", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim().toLowerCase(), role: inviteRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to invite");
      setInviteEmail("");
      setRevealedLink(data?.invite?.link ?? null);
      toast.success("Invite link generated");
      loadInvites();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite");
    } finally {
      setInviting(false);
    }
  };

  const revokeInvite = async (id: string) => {
    try {
      const res = await apiFetch(`/api/invites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setInvites(prev => prev.filter(i => i.id !== id));
      toast.success("Invite revoked");
    } catch {
      toast.error("Failed to revoke invite");
    }
  };

  const copyToClipboard = async (text: string, label = "Link") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Couldn't copy — please copy manually");
    }
  };

  const loadFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const res = await apiFetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data.feedback ?? []);
      }
    } catch { /* ignore */ }
    finally { setFeedbackLoading(false); }
  };

  const undoFeedback = async (feedbackId: string) => {
    try {
      const res = await apiFetch(`/api/feedback/${feedbackId}`, { method: "DELETE" });
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(prev => prev.filter(f => f.id !== feedbackId));
        toast.success(data.restored ? "Undo successful — commitment restored" : "Correction removed");
      }
    } catch { toast.error("Failed to undo"); }
  };

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
            setHandles({
              telegramUsername: data?.user?.telegramUsername ?? "",
              whatsappHandle: data?.user?.whatsappHandle ?? "",
              teamsHandle: data?.user?.teamsHandle ?? "",
            });
          }
        } catch { /* empty */ }
      }

      // Load real member list + pending invites in parallel
      Promise.all([loadMembers(), loadInvites()]).catch(() => {});

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

      <Tabs defaultValue="workspace" onValueChange={(v) => { if (v === "corrections" && feedbackList.length === 0 && !feedbackLoading) loadFeedback(); }}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="ai">AI summaries</TabsTrigger>
          <TabsTrigger value="trackers">Trackers</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="corrections">AI Corrections</TabsTrigger>
        </TabsList>

        {/* Workspace */}
        <TabsContent value="workspace" className="mt-6 space-y-6">
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

          {/* Personal handles — used by the AI to recognize when chat messages reference you */}
          <Card className="p-6 space-y-4 max-w-xl">
            <div>
              <h2 className="font-semibold">Your handles on other platforms</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Add the handles you use elsewhere so the AI can spot questions, mentions, and commitments aimed at you across chats.
              </p>
            </div>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="tg-username">Telegram username</Label>
                  <Input
                    id="tg-username"
                    placeholder="hammer123"
                    value={handles.telegramUsername}
                    onChange={(e) => setHandles(h => ({ ...h, telegramUsername: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Without the @. e.g. <code>hammer123</code></p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wa-handle">WhatsApp number</Label>
                  <Input
                    id="wa-handle"
                    placeholder="+15551234567"
                    value={handles.whatsappHandle}
                    onChange={(e) => setHandles(h => ({ ...h, whatsappHandle: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">In international format with country code.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teams-handle">Teams username or email</Label>
                  <Input
                    id="teams-handle"
                    placeholder="you@company.com"
                    value={handles.teamsHandle}
                    onChange={(e) => setHandles(h => ({ ...h, teamsHandle: e.target.value }))}
                  />
                </div>
                <Button onClick={saveHandles} disabled={savingHandles}>
                  {savingHandles ? "Saving..." : "Save handles"}
                </Button>
              </>
            )}
          </Card>
        </TabsContent>

        {/* Team */}
        <TabsContent value="team" className="mt-6 space-y-6">
          {/* Invite member */}
          {(me?.role === "OWNER" || me?.role === "ADMIN") && (
            <Card className="p-6 space-y-4">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Invite a team member
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate a shareable link valid for 7 days. Send it to your teammate over any channel you prefer.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="teammate@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Select value={inviteRole} onValueChange={(v: "MEMBER" | "ADMIN") => setInviteRole(v)}>
                  <SelectTrigger className="w-full sm:w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                  {inviting ? "Inviting..." : "Generate link"}
                </Button>
              </div>

              {revealedLink && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <div className="text-xs font-medium text-primary">Invite link ready — copy and share:</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-background border rounded px-2 py-1.5 break-all">{revealedLink}</code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(revealedLink, "Invite link")}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Pending invites */}
          {(me?.role === "OWNER" || me?.role === "ADMIN") && invites.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Pending invites</h2>
              <div className="space-y-2">
                {invites.map(i => (
                  <div key={i.id} className="flex items-center justify-between p-3 border border-border rounded-lg gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{i.email}</div>
                      <div className="text-xs text-muted-foreground">
                        {i.role.toLowerCase()} · expires {new Date(i.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(i.link, "Invite link")}>
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => revokeInvite(i.id)} title="Revoke invite">
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Active members */}
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

        {/* Custom Trackers */}
        <TabsContent value="trackers" className="mt-6">
          <TrackerBuilderTab />
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

        {/* AI Corrections */}
        <TabsContent value="corrections" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold">AI Corrections</h2>
              </div>
              <Button variant="outline" size="sm" onClick={loadFeedback} disabled={feedbackLoading}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${feedbackLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              These are items you've marked as incorrect AI extractions. They're used to improve future summaries. Undo to remove the correction (and restore the item if applicable).
            </p>
            {feedbackLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : feedbackList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No corrections recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {feedbackList.map(f => (
                  <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="text-xs py-0">
                          {f.type === "NOT_A_COMMITMENT" ? "Not a commitment" : "Not a timeline event"}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">{f.chatTitle}</span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">{f.content}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(f.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-muted-foreground hover:text-primary gap-1.5"
                      onClick={() => undoFeedback(f.id)}
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Undo
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
