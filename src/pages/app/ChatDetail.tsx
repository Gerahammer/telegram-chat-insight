import { Link, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AttentionBadge, SentimentBadge, PriorityBadge, StatusBadge, TimeAgo } from "@/components/Badges";
import { ArrowLeft, Hash, MessageSquare, Users, Sparkles, AlertCircle, HelpCircle, Flag } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { chats, chatMessages, chatSummary, actionItems, messageVolume, sentimentTimeline } from "@/lib/mock-data";

const ChatDetail = () => {
  const { id = "vip" } = useParams();
  const chat = chats.find((c) => c.id === id) ?? chats[0];
  const messages = chatMessages[chat.id] ?? [];
  const actions = actionItems.filter((a) => a.chatId === chat.id);
  const flagged = messages.filter((m) => m.flagged);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3"><Link to="/app/chats"><ArrowLeft className="h-4 w-4 mr-2" />All chats</Link></Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center shadow-glow"><Hash className="h-6 w-6 text-primary-foreground" /></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{chat.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <Badge variant="secondary" className="capitalize">{chat.type}</Badge>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{chat.members} members</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{chat.messagesToday} today</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SentimentBadge sentiment={chat.sentiment} />
            <AttentionBadge status={chat.attention} />
          </div>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0"><Sparkles className="h-4 w-4 text-primary-foreground" /></div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-semibold">Today's AI summary</h2>
              <Badge variant="outline" className="text-xs">Updated 12 min ago</Badge>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{chatSummary(chat.id)}</p>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-1">Message volume</h2>
          <p className="text-xs text-muted-foreground mb-4">Last 7 days</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={messageVolume}>
                <defs>
                  <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="messages" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#vol)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-1">Sentiment timeline</h2>
          <p className="text-xs text-muted-foreground mb-4">Today, hour by hour</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sentimentTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis domain={[-1, 1]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><AlertCircle className="h-4 w-4 text-warning" /> Action items</h2>
          <div className="space-y-2">
            {actions.length === 0 && <p className="text-sm text-muted-foreground">No action items detected.</p>}
            {actions.map((a) => (
              <div key={a.id} className="p-3 rounded-lg border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm">{a.title}</div>
                  <PriorityBadge priority={a.priority} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                <div className="mt-2 flex items-center gap-2"><StatusBadge status={a.status} /><span className="text-xs text-muted-foreground">by {a.requestedBy}</span></div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><HelpCircle className="h-4 w-4 text-primary" /> Unanswered questions</h2>
          <div className="space-y-2">
            {flagged.length === 0 && <p className="text-sm text-muted-foreground">No unanswered questions.</p>}
            {flagged.map((m) => (
              <div key={m.id} className="p-3 rounded-lg border border-border bg-warning/5">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span className="font-medium text-foreground">{m.author}</span>
                  <span>{m.time}</span>
                </div>
                <p className="text-sm">{m.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4"><Flag className="h-4 w-4" /> Recent messages</h2>
        <div className="space-y-3">
          {messages.length === 0 && <p className="text-sm text-muted-foreground">Recent messages will appear here.</p>}
          {messages.map((m) => (
            <div key={m.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold shrink-0">{m.author.split(" ").map((s) => s[0]).join("")}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold">{m.author}</span>
                  <span className="text-muted-foreground">{m.time}</span>
                  {m.flagged && <Badge variant="outline" className="text-xs h-5 bg-warning/10 text-warning border-warning/20">Needs reply</Badge>}
                </div>
                <p className="text-sm mt-0.5">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ChatDetail;
