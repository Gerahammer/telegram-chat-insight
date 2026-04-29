import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { AttentionBadge } from "@/components/Badges";
import {
  MessagesSquare,
  AlertTriangle,
  MoonStar,
  ListTodo,
  MessageSquare,
  Smile,
  ArrowRight,
  Inbox,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { apiFetch } from "@/lib/api";
import type { AttentionStatus } from "@/lib/mock-data";

interface OverviewStats {
  totalConnectedChats?: number;
  connectedChats?: number;
  chatsNeedingAttention?: number;
  needAttention?: number;
  chatsWithNoActivity?: number;
  noActivity?: number;
  openActionItems?: number;
  openActions?: number;
  totalMessagesToday?: number;
  messagesToday?: number;
  averageSentiment?: number | string;
  avgSentiment?: number | string;
  messageVolume?: { day: string; messages: number }[];
  activityBreakdown?: { name: string; value: number; color?: string }[];
}

interface MeResponse {
  name?: string;
  fullName?: string;
  firstName?: string;
  email?: string;
  workspace?: { name?: string };
  workspaceName?: string;
}

interface ChatItem {
  id: string;
  name: string;
  attention?: AttentionStatus | string;
  unanswered?: number;
  messagesToday?: number;
}

interface SummaryItem {
  id: string;
  chat?: string;
  chatName?: string;
  summary?: string;
  text?: string;
  time?: string;
  createdAt?: string;
  attention?: AttentionStatus | string;
}

const ATTENTION_COLOR: Record<string, string> = {
  Active: "hsl(var(--success))",
  active: "hsl(var(--success))",
  ok: "hsl(var(--success))",
  "Needs attention": "hsl(var(--warning))",
  needs_attention: "hsl(var(--warning))",
  Urgent: "hsl(var(--destructive))",
  urgent: "hsl(var(--destructive))",
  "No activity": "hsl(var(--muted-foreground))",
  no_activity: "hsl(var(--muted-foreground))",
};

async function safeJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [summaries, setSummaries] = useState<SummaryItem[]>([]);
  const [openActionsCount, setOpenActionsCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [overviewRes, meRes, chatsRes, summariesRes, actionsRes] = await Promise.all([
        apiFetch("/api/dashboard/overview").catch(() => null),
        apiFetch("/api/auth/me").catch(() => null),
        apiFetch("/api/chats").catch(() => null),
        apiFetch("/api/summaries/daily").catch(() => null),
        apiFetch("/api/action-items?status=OPEN").catch(() => null),
      ]);

      if (cancelled) return;

      const overview = overviewRes ? await safeJson<OverviewStats>(overviewRes) : null;
      const meData = meRes ? await safeJson<MeResponse>(meRes) : null;
      const chatsData = chatsRes ? await safeJson<ChatItem[] | { items?: ChatItem[] }>(chatsRes) : null;
      const summariesData = summariesRes
        ? await safeJson<SummaryItem[] | { items?: SummaryItem[] }>(summariesRes)
        : null;
      const actionsData = actionsRes
        ? await safeJson<unknown[] | { items?: unknown[]; total?: number; count?: number }>(actionsRes)
        : null;

      setStats(overview);
      setMe(meData);
      setChats(Array.isArray(chatsData) ? chatsData : chatsData?.items ?? []);
      setSummaries(Array.isArray(summariesData) ? summariesData : summariesData?.items ?? []);

      if (Array.isArray(actionsData)) setOpenActionsCount(actionsData.length);
      else if (actionsData && typeof actionsData === "object") {
        const o = actionsData as { items?: unknown[]; total?: number; count?: number };
        setOpenActionsCount(o.total ?? o.count ?? o.items?.length ?? 0);
      } else {
        setOpenActionsCount(0);
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const userName =
    me?.firstName ||
    me?.name?.split(" ")[0] ||
    me?.fullName?.split(" ")[0] ||
    me?.email?.split("@")[0] ||
    "there";

  const totalChats = stats?.totalConnectedChats ?? stats?.connectedChats ?? chats.length ?? 0;
  const needAttention =
    stats?.chatsNeedingAttention ??
    stats?.needAttention ??
    chats.filter((c) => c.attention === "needs_attention" || c.attention === "urgent").length;
  const noActivity =
    stats?.chatsWithNoActivity ??
    stats?.noActivity ??
    chats.filter((c) => c.attention === "no_activity").length;
  const openActions = stats?.openActionItems ?? stats?.openActions ?? openActionsCount ?? 0;
  const messagesToday =
    stats?.totalMessagesToday ??
    stats?.messagesToday ??
    chats.reduce((s, c) => s + (c.messagesToday ?? 0), 0);
  const avgSentiment = stats?.averageSentiment ?? stats?.avgSentiment ?? 0;

  const messageVolume = stats?.messageVolume ?? [];
  const activityBreakdown =
    stats?.activityBreakdown?.map((e) => ({
      ...e,
      color: e.color ?? ATTENTION_COLOR[e.name] ?? "hsl(var(--muted-foreground))",
    })) ?? [];

  const attentionChats = chats.filter(
    (c) => c.attention === "urgent" || c.attention === "needs_attention",
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {loading ? "Loading…" : `Good morning, ${userName} 👋`}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening across your Telegram chats today.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard label="Connected chats" value={loading ? "–" : totalChats} icon={MessagesSquare} hint="across workspace" />
        <StatCard label="Need attention" value={loading ? "–" : needAttention} icon={AlertTriangle} variant="warning" hint="reply soon" />
        <StatCard label="No activity" value={loading ? "–" : noActivity} icon={MoonStar} hint="last 24h" />
        <StatCard label="Open actions" value={loading ? "–" : openActions} icon={ListTodo} variant="destructive" />
        <StatCard label="Messages today" value={loading ? "–" : messagesToday} icon={MessageSquare} />
        <StatCard
          label="Avg sentiment"
          value={loading ? "–" : typeof avgSentiment === "number" ? avgSentiment.toFixed(2) : avgSentiment}
          icon={Smile}
          variant="success"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Message volume</h2>
              <p className="text-sm text-muted-foreground">Last 7 days across all chats</p>
            </div>
          </div>
          <div className="h-[260px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : messageVolume.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No message data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={messageVolume}>
                  <defs>
                    <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" />
                      <stop offset="100%" stopColor="hsl(var(--primary-glow))" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="messages" fill="url(#bar)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-lg">Activity breakdown</h2>
          <p className="text-sm text-muted-foreground">Your chats right now</p>
          <div className="h-[260px]">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : activityBreakdown.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No activity yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={activityBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {activityBreakdown.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Chats requiring attention</h2>
              <p className="text-sm text-muted-foreground">Sorted by urgency</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/chats">View all <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          <div className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : attentionChats.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No chats need attention right now</p>
              </div>
            ) : (
              attentionChats.map((c) => (
                <Link
                  key={c.id}
                  to={`/app/chats/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-secondary/50 transition"
                >
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {(c.unanswered ?? 0)} unanswered · {(c.messagesToday ?? 0)} messages today
                    </div>
                  </div>
                  <AttentionBadge status={(c.attention as AttentionStatus) ?? "ok"} />
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Recent summaries</h2>
              <p className="text-sm text-muted-foreground">Latest AI digests</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/summaries">View all <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : summaries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No summaries yet</p>
              </div>
            ) : (
              summaries.slice(0, 4).map((s) => (
                <div key={s.id} className="p-3 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm">{s.chat ?? s.chatName ?? "Chat"}</div>
                    <div className="flex items-center gap-2">
                      {(s.time || s.createdAt) && (
                        <span className="text-xs text-muted-foreground">{s.time ?? s.createdAt}</span>
                      )}
                      {s.attention && <AttentionBadge status={s.attention as AttentionStatus} />}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {s.summary ?? s.text ?? ""}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
