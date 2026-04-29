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
import { Bot, Copy, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface Member { id?: string; name?: string; email?: string; role?: string; }
interface MeResponse {
  name?: string; fullName?: string; email?: string;
  workspace?: { name?: string; slug?: string; timezone?: string };
  workspaceName?: string;
}

const Settings = () => {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [meRes, membersRes, tokenRes] = await Promise.all([
        apiFetch("/api/auth/me").catch(() => null),
        apiFetch("/api/workspaces/current/members").catch(() => null),
        apiFetch("/api/workspaces/current/connection-token").catch(() => null),
      ]);
      if (meRes?.ok) {
        try { if (!cancelled) setMe(await meRes.json()); } catch { /* empty */ }
      }
      if (membersRes?.ok) {
        try {
          const data = await membersRes.json();
          const list: Member[] = Array.isArray(data) ? data : data?.items ?? [];
          if (!cancelled) setMembers(list);
        } catch { /* empty */ }
      }
      if (tokenRes?.ok) {
        try {
          const data = await tokenRes.json();
          if (!cancelled) setToken(data?.connectionToken ?? data?.token ?? null);
        } catch { /* empty */ }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const workspaceName = me?.workspace?.name ?? me?.workspaceName ?? "";
  const workspaceSlug = me?.workspace?.slug ?? "";
  const workspaceTz = me?.workspace?.timezone ?? "utc";

  return (
    <div className="space-y-6 max-w-[1100px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your workspace, team, and AI preferences.</p>
      </div>

      <Tabs defaultValue="workspace">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="bot">Bot</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="ai">AI summaries</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="mt-6">
          <Card className="p-6 space-y-4 max-w-xl">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <>
                <div className="space-y-2"><Label>Workspace name</Label><Input defaultValue={workspaceName} /></div>
                <div className="space-y-2"><Label>Workspace URL</Label><Input defaultValue={workspaceSlug} /></div>
                <div className="space-y-2"><Label>Time zone</Label>
                  <Select defaultValue={workspaceTz}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="cet">CET (Europe/Berlin)</SelectItem>
                      <SelectItem value="est">EST (America/New_York)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="gradient-primary border-0">Save changes</Button>
              </>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Team members</h2>
              <Button size="sm" className="gradient-primary border-0"><Plus className="h-3 w-3 mr-2" /> Invite</Button>
            </div>
            <div className="space-y-2">
              {loading ? (
                <>
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </>
              ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No team members yet.</p>
              ) : (
                members.map((m) => {
                  const name = m.name ?? m.email ?? "Member";
                  const initials = name.split(/\s+/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={m.id ?? m.email ?? name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{initials}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-medium text-sm">{name}</div>
                          {m.email && <div className="text-xs text-muted-foreground">{m.email}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {m.role && <Badge variant="secondary">{m.role}</Badge>}
                        {m.role && m.role.toLowerCase() !== "owner" && (
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="bot" className="mt-6">
          <Card className="p-6 max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center"><Bot className="h-5 w-5 text-primary-foreground" /></div>
              <div>
                <h2 className="font-semibold">Telegram bot connection</h2>
                <p className="text-sm text-muted-foreground">Add @Sumerz_bot to any group to start monitoring.</p>
              </div>
            </div>
            <ol className="space-y-3 text-sm">
              {[
                "Add @Sumerz_bot to your Telegram group",
                "Make the bot an admin",
                "Send /connect [token] in the group",
                "Return to the dashboard to confirm the connection",
              ].map((s, i) => (
                <li key={s} className="flex gap-3 items-start">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">{i + 1}</div>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-6 p-4 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Workspace connection token</div>
                <div className="font-mono text-lg font-bold">
                  {loading ? <Skeleton className="h-6 w-32" /> : token ?? "Unavailable"}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!token}
                onClick={() => {
                  if (!token) return;
                  navigator.clipboard.writeText(token);
                  toast.success("Copied!");
                }}
              >
                <Copy className="h-3 w-3 mr-2" />Copy
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="p-6 space-y-4 max-w-xl">
            {[
              { t: "Daily email digest", d: "Receive a summary of all chats every morning." },
              { t: "Urgent alerts", d: "Get notified instantly when a chat needs urgent attention." },
              { t: "Slack notifications", d: "Send digests and alerts to your Slack workspace." },
              { t: "Weekly report", d: "A weekly performance digest sent every Monday." },
            ].map((n, i) => (
              <div key={n.t} className="flex items-start justify-between gap-4 py-2">
                <div>
                  <Label>{n.t}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.d}</p>
                </div>
                <Switch defaultChecked={i < 2} />
              </div>
            ))}
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card className="p-6 space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label>Summary length</Label>
              <Select defaultValue="medium">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short (2-3 sentences)</SelectItem>
                  <SelectItem value="medium">Medium (1 paragraph)</SelectItem>
                  <SelectItem value="long">Detailed (multi-paragraph)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Summary tone</Label>
              <Select defaultValue="neutral">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">Neutral & factual</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="executive">Executive briefing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-start justify-between gap-4 py-2">
              <div>
                <Label>Detect action items</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Automatically extract tasks from conversations.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-start justify-between gap-4 py-2">
              <div>
                <Label>Sentiment tracking</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Score the overall sentiment of each chat.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <Card className="p-6 space-y-4 max-w-xl">
            <div className="space-y-2">
              <Label>Data retention</Label>
              <Select defaultValue="90">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Older messages are automatically deleted from our servers.</p>
            </div>
            <Button variant="outline">Export workspace data</Button>
            <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">Delete workspace</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
