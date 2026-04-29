import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { AttentionBadge } from "@/components/Badges";
import {
  MessagesSquare, AlertTriangle, MoonStar, ListTodo,
  MessageSquare, Smile, ArrowRight, Inbox,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { apiFetch } from "@/lib/api";
import type { AttentionStatus } from "@/lib/mock-data";

interface OverviewStats {
  totalConnectedChats?: number;
  chatsNeedingAttention?: number;
  chatsWithNoActivity?: number;
  openActionItems?: number;
  totalMessagesToday?: number;
  averageSentiment?: number | string;
  chartData?: { date: string; count: number }[];
  recentSummaries?: RecentSummary[];
}

interface RecentSummary {
  id: string;
  chatId: string;
  chatTitle?: string;
  summaryText?: string;
  requiresAttention?: boolean;
  priority?: string;
  sentiment?: string;
  noActivity?: boolean;
  date?: string;
}

interface MeResponse {
  user?: { name?: string; email?: string };
  company?: { name?: string };
}

interface ApiChat {
  id: string;
  title?: string;
  requiresAttention?: boolean;
  isActive?: boolean;
  messageCount?: number;
}

async function safeJson<T>(res: Response | null): Promise<T | null> {
  if (!res || !res.ok) return null;
  try { return (await res.json()) as T; } catch { return null; }
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [chats, setChats] = useState<ApiChat[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [overviewRes, meRes, chatsRes] = await Promise.all([
        apiFetch("/api/dashboard/overview").catch(() => null),
        apiFetch("/api/auth/me").catch(() => null),
        apiFetch("/api/chats").catch(() => null),
      ]);
      if (cancelled) return;

      const overview = await safeJson<OverviewStats>(overviewRes);
      const meData = await safeJson<MeResponse>(meRes);
      const chatsData = await safeJson<{ chats?: ApiChat[] } | ApiChat[]>(chatsRes);

      setStats(overview);
      setMe(meData);
      const chatList = Array.isArray(chatsData) ? chatsData : (chatsData as any)?.chats ?? [];
      setChats(chatList);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const userName =
    me?.user?.name?.split(" ")[0] ||
    me?.user?.email?.split("@")[0] ||
    "there";

  const totalChats = stats?.totalConnectedChats ?? chats.length;
  const needAttention = stats?.chatsNeedingAttention ?? 0;
  const noActivity = stats?.chatsWithNoActivity ?? 0;
  const openActions = stats?.openActionItems ?? 0;
  const messagesToday = stats?.totalMessagesToday ?? 0;
  const avgSentiment = stats?.averageSentiment ?? "neutral";

  const messageVolume = (stats?.chartData ?? []).map(d => ({
    day: d.date?.slice(5),
    messages: d.count,
  }));

  const activeCount = chats.filter(c => c.isActive && !c.requiresAttention).length;
  const attentionCount = chats.filter(c => c.requiresAttention).length;
  const activityBreakdown = chats.length > 0 ? [
    { name: "Active", value: activeCount, color: "hsl(142 76% 36%)" },
    { name: "Needs attention", value: attentionCount, color: "hsl(38 92% 50%)" },
    { name: "No activity", value: noActivity, color: "hsl(215 20% 65%)" },
  ].filter(e => e.value > 0) : [];

  const recentSummaries = stats?.recentSummaries ?? [];
  const attentionChats = chats.filter(c => c.requiresAttention);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {loading ? "Loading…" : `${greeting}, ${userName} 👋`}
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
          value={loading ? "–" : typeof avgSentiment === "number" ? avgSentiment.toFixed(2) : String(avgSentiment)}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="messages" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
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
                    {activityBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
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
              <><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></>
            ) : attentionChats.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No chats need attention right now</p>
              </div>
            ) : (
              attentionChats.map((c) => (
                <Link key={c.id} to={`/app/chats/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-secondary/50 transition">
                  <div>
                    <div className="font-medium">{c.title ?? "Untitled chat"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.messageCount ?? 0} messages today</div>
                  </div>
                  <AttentionBadge status={"needs_attention" as AttentionStatus} />
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
              <><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></>
            ) : recentSummaries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No summaries yet</p>
              </div>
            ) : (
              recentSummaries.slice(0, 4).map((s) => (
                <Link key={s.id} to={`/app/chats/${s.chatId}`}
                  className="block p-3 rounded-lg border border-border hover:border-primary/40 transition">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm">{s.chatTitle ?? "Chat"}</div>
                    <span className="text-xs text-muted-foreground">{s.date?.slice(0, 10)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.summaryText ?? ""}</p>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
