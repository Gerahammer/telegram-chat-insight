import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/StatCard";
import { SentimentBadge, TimeAgo } from "@/components/Badges";
import {
  MessagesSquare, AlertTriangle, MoonStar, ListTodo,
  MessageSquare, ArrowRight, Inbox, GitCommit, Activity,
  CheckCircle2, XCircle, TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, AreaChart, Area,
} from "recharts";
import { apiFetch } from "@/lib/api";

interface OverviewStats {
  totalConnectedChats?: number;
  chatsNeedingAttention?: number;
  chatsWithNoActivity?: number;
  openActionItems?: number;
  openCommitments?: number;
  overdueCommitments?: number;
  totalMessagesToday?: number;
  averageSentiment?: string;
  avgHealthScore?: number;
  chartData?: { date: string; count: number }[];
  recentSummaries?: RecentSummary[];
  chatHealthList?: ChatHealth[];
}

interface RecentSummary {
  id: string;
  chatId: string;
  chatTitle?: string;
  summaryText?: string;
  requiresAttention?: boolean;
  sentiment?: string;
  noActivity?: boolean;
  date?: string;
}

interface ChatHealth {
  id: string;
  title: string;
  healthScore: number;
  healthLabel: string;
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
  healthScore?: number;
  healthLabel?: string;
  todaySummary?: any;
  lastSummarizedAt?: string;
}

async function safeJson<T>(res: Response | null): Promise<T | null> {
  if (!res || !res.ok) return null;
  try { return (await res.json()) as T; } catch { return null; }
}

const HEALTH_COLOR: Record<string, string> = {
  HEALTHY:  "hsl(142 76% 36%)",
  AT_RISK:  "hsl(38 92% 50%)",
  CRITICAL: "hsl(var(--destructive))",
};

const HealthBar = ({ score, label }: { score: number; label: string }) => {
  const color = HEALTH_COLOR[label] ?? HEALTH_COLOR.HEALTHY;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-medium w-8 text-right">{score}</span>
    </div>
  );
};

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
      setChats(Array.isArray(chatsData) ? chatsData : (chatsData as any)?.chats ?? []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const userName = me?.user?.name?.split(" ")[0] || me?.user?.email?.split("@")[0] || "there";
  const totalChats = stats?.totalConnectedChats ?? chats.length;
  const needAttention = stats?.chatsNeedingAttention ?? 0;
  const noActivity = stats?.chatsWithNoActivity ?? 0;
  const openActions = stats?.openActionItems ?? 0;
  const openCommitments = stats?.openCommitments ?? 0;
  const overdueCommitments = stats?.overdueCommitments ?? 0;
  const messagesToday = stats?.totalMessagesToday ?? 0;
  const avgHealth = stats?.avgHealthScore ?? 100;

  const chartData = (stats?.chartData ?? []).map(d => ({
    day: new Date(d.date).toLocaleDateString("en-GB", { weekday: "short" }),
    messages: d.count,
  }));

  const recentSummaries = stats?.recentSummaries ?? [];
  const chatHealthList = stats?.chatHealthList ?? [];
  const attentionChats = chats.filter(c => c.requiresAttention);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const healthLabel = avgHealth >= 71 ? "HEALTHY" : avgHealth >= 41 ? "AT_RISK" : "CRITICAL";
  const HealthIcon = healthLabel === "HEALTHY" ? CheckCircle2 : healthLabel === "AT_RISK" ? AlertTriangle : XCircle;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {loading ? "Loading…" : `${greeting}, ${userName} 👋`}
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening across your Telegram chats today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatCard label="Connected chats"    value={loading ? "–" : totalChats}        icon={MessagesSquare} hint="total" />
        <StatCard label="Need attention"     value={loading ? "–" : needAttention}     icon={AlertTriangle}  variant="warning" hint="reply soon" />
        <StatCard label="No activity"        value={loading ? "–" : noActivity}        icon={MoonStar}       hint="last 24h" />
        <StatCard label="Open actions"       value={loading ? "–" : openActions}       icon={ListTodo}       variant="destructive" />
        <StatCard label="Open commitments"   value={loading ? "–" : openCommitments}   icon={GitCommit}      hint={overdueCommitments > 0 ? `${overdueCommitments} overdue` : undefined} variant={overdueCommitments > 0 ? "warning" : undefined} />
        <StatCard label="Messages today"     value={loading ? "–" : messagesToday}     icon={MessageSquare} />
        <StatCard label="Avg health"         value={loading ? "–" : avgHealth}         icon={HealthIcon}     variant={healthLabel === "HEALTHY" ? "success" : healthLabel === "AT_RISK" ? "warning" : "destructive"} hint={healthLabel.toLowerCase().replace("_", " ")} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Message volume */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Message volume</h2>
              <p className="text-sm text-muted-foreground">Last 7 days across all chats</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-[220px]">
            {loading ? <Skeleton className="h-full w-full" /> :
             chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <Inbox className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No message data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="messages" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#msgGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Chat health scores */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Chat health</h2>
              <p className="text-sm text-muted-foreground">Lowest scoring chats</p>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          {loading ? <Skeleton className="h-40 w-full" /> :
           chatHealthList.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No health data yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chatHealthList.map(c => (
                <Link key={c.id} to={`/app/chats/${c.id}`} className="block group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium group-hover:text-primary transition truncate">{c.title}</span>
                    <Badge variant="outline" className={`text-xs ml-2 shrink-0 ${
                      c.healthLabel === "HEALTHY" ? "text-success border-success/30 bg-success/10" :
                      c.healthLabel === "AT_RISK" ? "text-warning border-warning/30 bg-warning/10" :
                      "text-destructive border-destructive/30 bg-destructive/10"
                    }`}>{c.healthLabel.replace("_", " ")}</Badge>
                  </div>
                  <HealthBar score={c.healthScore} label={c.healthLabel} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chats needing attention */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Needs attention</h2>
              <p className="text-sm text-muted-foreground">Chats requiring a response</p>
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
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">All chats are up to date ✓</p>
              </div>
            ) : (
              attentionChats.slice(0, 4).map(c => (
                <Link key={c.id} to={`/app/chats/${c.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-secondary/50 transition">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{c.title ?? "Untitled"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.messageCount ?? 0} messages today</div>
                  </div>
                  {c.todaySummary?.sentiment && (
                    <SentimentBadge sentiment={c.todaySummary.sentiment} />
                  )}
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Recent summaries */}
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
                <p className="text-sm">No summaries yet — generate one from a chat page</p>
              </div>
            ) : (
              recentSummaries.slice(0, 4).map(s => (
                <Link key={s.id} to={`/app/chats/${s.chatId}`}
                  className="block p-3 rounded-lg border border-border hover:border-primary/40 transition">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium text-sm">{s.chatTitle ?? "Chat"}</div>
                    <div className="flex items-center gap-2">
                      {s.sentiment && <SentimentBadge sentiment={s.sentiment} />}
                      {s.requiresAttention && (
                        <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10 text-xs">Attention</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {s.noActivity ? "No activity on this day." : (s.summaryText ?? "")}
                  </p>
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
