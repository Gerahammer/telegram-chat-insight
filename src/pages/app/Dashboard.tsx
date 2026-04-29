import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { AttentionBadge } from "@/components/Badges";
import { MessagesSquare, AlertTriangle, MoonStar, ListTodo, MessageSquare, Smile, ArrowRight } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { chats, actionItems, messageVolume, activityBreakdown, recentSummaries } from "@/lib/mock-data";

const Dashboard = () => {
  const totalChats = chats.length;
  const needAttention = chats.filter((c) => c.attention === "needs_attention" || c.attention === "urgent").length;
  const noActivity = chats.filter((c) => c.attention === "no_activity").length;
  const openActions = actionItems.filter((a) => a.status !== "resolved").length;
  const messagesToday = chats.reduce((s, c) => s + c.messagesToday, 0);

  const attentionChats = chats.filter((c) => c.attention === "urgent" || c.attention === "needs_attention");

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Good morning, Jordan 👋</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening across your Telegram chats today.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard label="Connected chats" value={totalChats} icon={MessagesSquare} hint="across workspace" />
        <StatCard label="Need attention" value={needAttention} icon={AlertTriangle} variant="warning" hint="reply soon" />
        <StatCard label="No activity" value={noActivity} icon={MoonStar} hint="last 24h" />
        <StatCard label="Open actions" value={openActions} icon={ListTodo} variant="destructive" trend={{ value: 12, positive: false }} />
        <StatCard label="Messages today" value={messagesToday} icon={MessageSquare} trend={{ value: 8, positive: true }} />
        <StatCard label="Avg sentiment" value="+0.12" icon={Smile} variant="success" hint="neutral-positive" />
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
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-lg">Activity breakdown</h2>
          <p className="text-sm text-muted-foreground">Your chats right now</p>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={activityBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {activityBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
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
            <Button variant="ghost" size="sm" asChild><Link to="/app/chats">View all <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
          </div>
          <div className="space-y-2">
            {attentionChats.map((c) => (
              <Link key={c.id} to={`/app/chats/${c.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-secondary/50 transition">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.unanswered} unanswered · {c.messagesToday} messages today</div>
                </div>
                <AttentionBadge status={c.attention} />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-lg">Recent summaries</h2>
              <p className="text-sm text-muted-foreground">Latest AI digests</p>
            </div>
            <Button variant="ghost" size="sm" asChild><Link to="/app/summaries">View all <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
          </div>
          <div className="space-y-3">
            {recentSummaries.map((s) => (
              <div key={s.id} className="p-3 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm">{s.chat}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{s.time}</span>
                    <AttentionBadge status={s.attention} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{s.summary}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
