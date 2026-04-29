import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AttentionBadge, SentimentBadge, PriorityBadge, StatusBadge, TimeAgo } from "@/components/Badges";
import { ArrowLeft, Hash, MessageSquare, Users, Sparkles, AlertCircle, HelpCircle, Flag, Inbox, Loader2, RefreshCw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import type { Chat, ActionItem, Message } from "@/lib/mock-data";

interface ChatDetailResponse {
  chat?: Chat;
  summary?: string;
  summaryUpdatedAt?: string;
  messageVolume?: { day: string; messages: number }[];
  sentimentTimeline?: { time: string; score: number }[];
  actionItems?: ActionItem[];
  messages?: Message[];
}

const ChatDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState<ChatDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleGenerateSummary = async () => {
    if (!id || generating) return;
    setGenerating(true);
    try {
      let res: Response;
      try {
        res = await apiFetch(`/api/chats/${encodeURIComponent(id)}/generate-summary`, {
          method: "POST",
        });
      } catch {
        toast.error("Network error — please try again");
        return;
      }

      let body: any = null;
      try {
        const text = await res.text();
        body = text ? JSON.parse(text) : null;
      } catch {
        body = null;
      }

      if (!res.ok) {
        const msg: string = body?.message ?? body?.error ?? "";
        if (res.status === 429) {
          toast.error("Summary was recently generated. Please wait before generating again.");
        } else if (res.status === 400 && /no messages/i.test(msg)) {
          toast.error("No messages in the last 24 hours to summarize");
        } else {
          toast.error(msg || `Failed to generate summary (${res.status})`);
        }
        return;
      }

      const newSummary: string | undefined =
        body?.summary ?? body?.todaySummary ?? body?.text ?? undefined;
      const updatedAt: string | undefined = body?.summaryUpdatedAt ?? body?.updatedAt;
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          summary: newSummary ?? prev.summary,
          summaryUpdatedAt: updatedAt ?? prev.summaryUpdatedAt,
        };
      });
      toast.success("Summary generated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [chatRes, msgRes] = await Promise.all([
          apiFetch(`/api/chats/${encodeURIComponent(id)}`),
          apiFetch(`/api/chats/${encodeURIComponent(id)}/messages`),
        ]);
        if (!chatRes.ok) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const json: any = await chatRes.json();
        // Backend may return the chat object directly or wrapped under `chat`.
        const rawChat = json && typeof json === "object" && "chat" in json ? json.chat : json;
        const chat: Chat | undefined = rawChat
          ? {
              ...rawChat,
              name: rawChat.title ?? rawChat.name ?? "Untitled chat",
              type: rawChat.chatType ?? rawChat.type,
              messagesToday: rawChat.messageCount ?? rawChat.messagesToday ?? 0,
              lastActivity: rawChat.lastActivityAt ?? rawChat.lastActivity,
              isActive: rawChat.isActive,
              todaySummary: rawChat.todaySummary,
            }
          : undefined;

        let messages: Message[] = [];
        if (msgRes.ok) {
          try {
            const mjson: any = await msgRes.json();
            const rawMsgs: any[] = Array.isArray(mjson) ? mjson : (mjson?.items ?? mjson?.messages ?? []);
            messages = rawMsgs.map((m: any) => ({
              id: String(m.id ?? m._id ?? crypto.randomUUID()),
              author: m.author ?? m.from ?? m.senderName ?? m.sender?.name ?? "Unknown",
              text: m.text ?? m.content ?? m.message ?? "",
              time: m.time ?? m.createdAt ?? m.timestamp ?? "",
              flagged: m.flagged ?? m.needsReply ?? false,
            }));
          } catch {
            messages = [];
          }
        }

        const base: ChatDetailResponse =
          json && typeof json === "object" && "chat" in json
            ? { ...(json as ChatDetailResponse), chat }
            : {
                chat,
                summary: rawChat?.todaySummary ?? undefined,
              };
        if (!cancelled) setData({ ...base, messages });
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (notFound || !data?.chat) {
    return (
      <div className="space-y-6 max-w-[1400px] mx-auto">
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link to="/app/chats"><ArrowLeft className="h-4 w-4 mr-2" />All chats</Link>
        </Button>
        <Card className="p-12 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">This chat is not available.</p>
        </Card>
      </div>
    );
  }

  const chat = data.chat;
  const messages = data.messages ?? [];
  const actions = data.actionItems ?? [];
  const flagged = messages.filter((m) => m.flagged);
  const messageVolume = data.messageVolume ?? [];
  const sentimentTimeline = data.sentimentTimeline ?? [];

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link to="/app/chats"><ArrowLeft className="h-4 w-4 mr-2" />All chats</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center shadow-glow"><Hash className="h-6 w-6 text-primary-foreground" /></div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{chat.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                {chat.type && <Badge variant="secondary" className="capitalize">{chat.type}</Badge>}
                {chat.lastActivity && (
                  <span className="flex items-center gap-1">
                    Last activity: <TimeAgo iso={chat.lastActivity} />
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {chat.messagesToday ?? 0} messages today
                </span>
                <Badge
                  variant="outline"
                  className={
                    chat.isActive
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-muted text-muted-foreground border-border"
                  }
                >
                  {chat.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {chat.sentiment && <SentimentBadge sentiment={chat.sentiment} />}
            {chat.attention && <AttentionBadge status={chat.attention} />}
          </div>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0"><Sparkles className="h-4 w-4 text-primary-foreground" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Today's AI summary</h2>
                {data.summaryUpdatedAt && <Badge variant="outline" className="text-xs">{data.summaryUpdatedAt}</Badge>}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleGenerateSummary}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                )}
                {generating ? "Generating..." : "Generate summary now"}
              </Button>
            </div>
            {generating ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating AI summary...</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground/90">
                {data.summary ?? "No summary available for this chat yet."}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold mb-1">Message volume</h2>
          <p className="text-xs text-muted-foreground mb-4">Last 7 days</p>
          <div className="h-[200px]">
            {messageVolume.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
            ) : (
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
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold mb-1">Sentiment timeline</h2>
          <p className="text-xs text-muted-foreground mb-4">Today, hour by hour</p>
          <div className="h-[200px]">
            {sentimentTimeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sentimentTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis domain={[-1, 1]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
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
                  {a.priority && <PriorityBadge priority={a.priority} />}
                </div>
                {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                <div className="mt-2 flex items-center gap-2">
                  {a.status && <StatusBadge status={a.status} />}
                  {a.requestedBy && <span className="text-xs text-muted-foreground">by {a.requestedBy}</span>}
                </div>
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
          {messages.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No messages yet — send some messages in your Telegram group</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold shrink-0">
                {m.author?.split(" ").map((s) => s[0]).join("").slice(0, 2) || "?"}
              </div>
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
