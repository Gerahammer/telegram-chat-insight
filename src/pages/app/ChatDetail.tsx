import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AttentionBadge, SentimentBadge, PriorityBadge, StatusBadge, TimeAgo } from "@/components/Badges";
import {
  ArrowLeft, Hash, MessageSquare, Users, Sparkles, AlertCircle,
  HelpCircle, Flag, Inbox, Loader2, RefreshCw, Calendar, Star,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import type { Chat, ActionItem, Message } from "@/lib/mock-data";

interface PersonalHighlight {
  message: string;
  from: string;
  time: string;
}

interface SummaryData {
  id: string;
  summaryText?: string;
  summary?: string;
  requiresAttention?: boolean;
  priority?: string;
  sentiment?: string;
  unansweredQuestions?: string[];
  urgentIssues?: string[];
  actionItems?: ActionItem[];
  generatedAt?: string;
  date?: string;
  noActivity?: boolean;
}

interface ChatDetailData {
  chat?: Chat & { memberCount?: number; lastSummarizedAt?: string };
  summary?: string;
  summaryUpdatedAt?: string;
  summaryData?: SummaryData;
  personalHighlights?: PersonalHighlight[];
  messageVolume?: { day: string; messages: number }[];
  actionItems?: ActionItem[];
  messages?: Message[];
}

// ─── Date picker helpers ──────────────────────────────────────────────────────

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (d >= today) return "Today";
  if (d >= yesterday) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  });
}

const ChatDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState<ChatDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch chat + messages once
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const [chatRes, msgRes] = await Promise.all([
          apiFetch(`/api/chats/${encodeURIComponent(id)}`),
          apiFetch(`/api/chats/${encodeURIComponent(id)}/messages`),
        ]);
        if (!chatRes.ok) { if (!cancelled) setNotFound(true); return; }

        const json: any = await chatRes.json();
        const rawChat = json?.chat ?? json;
        const chat = rawChat ? {
          ...rawChat,
          name: rawChat.title ?? rawChat.name ?? "Untitled chat",
          type: rawChat.chatType ?? rawChat.type,
          messagesToday: rawChat.messageCount ?? 0,
          lastActivity: rawChat.lastActivityAt,
          memberCount: rawChat.memberCount ?? null,
          lastSummarizedAt: rawChat.lastSummarizedAt ?? null,
        } : undefined;

        let messages: Message[] = [];
        if (msgRes.ok) {
          try {
            const mjson: any = await msgRes.json();
            const rawMsgs: any[] = Array.isArray(mjson) ? mjson : (mjson?.messages ?? []);
            messages = rawMsgs.map((m: any) => ({
              id: String(m.id ?? crypto.randomUUID()),
              author: m.senderName ?? m.author ?? "Unknown",
              text: m.text ?? "",
              time: m.sentAt ?? m.time ?? "",
              flagged: false,
            }));
          } catch { messages = []; }
        }

        if (!cancelled) setData({ chat, messages });
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Fetch summary for selected date
  useEffect(() => {
    if (!id || !data?.chat) return;
    let cancelled = false;
    setSummaryLoading(true);

    (async () => {
      try {
        const res = await apiFetch(`/api/chats/${encodeURIComponent(id)}/summaries?date=${selectedDate}`);
        if (!res.ok) { if (!cancelled) setData(prev => prev ? { ...prev, summaryData: undefined } : prev); return; }
        const json: any = await res.json();
        const summaries: SummaryData[] = Array.isArray(json) ? json : (json?.summaries ?? []);
        if (!cancelled) {
          setData(prev => prev ? {
            ...prev,
            summaryData: summaries[0] ?? undefined,
            actionItems: summaries[0]?.actionItems ?? [],
          } : prev);
        }
      } catch {
        if (!cancelled) setData(prev => prev ? { ...prev, summaryData: undefined } : prev);
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, selectedDate, data?.chat]);

  const handleGenerateSummary = async () => {
    if (!id || generating) return;
    setGenerating(true);
    try {
      const res = await apiFetch(`/api/chats/${encodeURIComponent(id)}/generate-summary`, { method: "POST" });
      let body: any = null;
      try { const t = await res.text(); body = t ? JSON.parse(t) : null; } catch { body = null; }

      if (!res.ok) {
        const msg = body?.message ?? body?.error ?? "";
        if (res.status === 429) toast.error("Summary was recently generated. Please wait before generating again.");
        else if (res.status === 400) toast.error("No messages in the last 24 hours to summarize.");
        else toast.error(msg || `Failed (${res.status})`);
        return;
      }

      // Update with new summary and personal highlights
      setData(prev => prev ? {
        ...prev,
        summaryData: body?.summary ?? prev.summaryData,
        personalHighlights: body?.personalHighlights ?? [],
        actionItems: body?.summary?.actionItems ?? prev.actionItems,
      } : prev);

      // Reset to today
      setSelectedDate(new Date().toISOString().slice(0, 10));
      toast.success("Summary generated!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  };

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
  const actions = data.actionItems ?? data.summaryData?.actionItems ?? [];
  const summaryText = data.summaryData?.summaryText ?? data.summaryData?.summary;
  const personalHighlights = data.personalHighlights ?? [];
  const days = getLast7Days();

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link to="/app/chats"><ArrowLeft className="h-4 w-4 mr-2" />All chats</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <Hash className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{chat.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                {chat.type && <Badge variant="secondary" className="capitalize">{chat.type}</Badge>}
                {chat.memberCount != null && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {chat.memberCount} members
                  </span>
                )}
                {chat.lastActivity && (
                  <span className="flex items-center gap-1">
                    Last activity: <TimeAgo iso={chat.lastActivity} />
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> {chat.messagesToday ?? 0} messages today
                </span>
                {chat.lastSummarizedAt && (
                  <span className="flex items-center gap-1 text-xs">
                    Last summarized: <TimeAgo iso={chat.lastSummarizedAt} />
                  </span>
                )}
                <Badge
                  variant="outline"
                  className={chat.isActive
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-muted text-muted-foreground border-border"}
                >
                  {chat.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="font-semibold">AI Summary</h2>
              <div className="flex items-center gap-2">
                {/* Date selector */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                  {days.map(day => (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`px-2 py-1 rounded text-xs font-medium transition ${
                        selectedDate === day
                          ? "bg-background shadow text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {formatDateLabel(day)}
                    </button>
                  ))}
                </div>
                <Button size="sm" variant="outline" onClick={handleGenerateSummary} disabled={generating}>
                  {generating ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-2" />}
                  {generating ? "Generating..." : "Generate now"}
                </Button>
              </div>
            </div>

            {/* Summary content */}
            {summaryLoading || generating ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{generating ? "Generating AI summary..." : "Loading summary..."}</span>
              </div>
            ) : summaryText ? (
              <p className="text-sm leading-relaxed text-foreground/90">{summaryText}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No summary available for {formatDateLabel(selectedDate)}.
                {selectedDate === new Date().toISOString().slice(0, 10) && " Click \"Generate now\" to create one."}
              </p>
            )}

            {/* Metadata badges */}
            {data.summaryData && !summaryLoading && (
              <div className="flex flex-wrap gap-2 mt-3">
                {data.summaryData.sentiment && (
                  <SentimentBadge sentiment={data.summaryData.sentiment as any} />
                )}
                {data.summaryData.requiresAttention && (
                  <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10 text-xs">
                    Needs attention
                  </Badge>
                )}
                {data.summaryData.generatedAt && (
                  <span className="text-xs text-muted-foreground">
                    Generated <TimeAgo iso={data.summaryData.generatedAt} />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Personal Highlights */}
      {personalHighlights.length > 0 && (
        <Card className="p-6 border-primary/30 bg-primary/3">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-primary" /> For you
            <Badge variant="secondary" className="text-xs">{personalHighlights.length}</Badge>
          </h2>
          <div className="space-y-3">
            {personalHighlights.map((h, i) => (
              <div key={i} className="p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span className="font-medium text-foreground">{h.from}</span>
                  <span>{h.time}</span>
                </div>
                <p className="text-sm">{h.message}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Action items */}
        <Card className="p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <AlertCircle className="h-4 w-4 text-warning" /> Action items
          </h2>
          <div className="space-y-2">
            {actions.length === 0
              ? <p className="text-sm text-muted-foreground">No action items for this period.</p>
              : actions.map((a: any) => (
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
              ))
            }
          </div>
        </Card>

        {/* Unanswered questions */}
        <Card className="p-6">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <HelpCircle className="h-4 w-4 text-primary" /> Unanswered questions
          </h2>
          <div className="space-y-2">
            {(data.summaryData?.unansweredQuestions ?? []).length === 0
              ? <p className="text-sm text-muted-foreground">No unanswered questions.</p>
              : (data.summaryData?.unansweredQuestions ?? []).map((q, i) => (
                <div key={i} className="p-3 rounded-lg border border-border bg-warning/5">
                  <p className="text-sm">{q}</p>
                </div>
              ))
            }
          </div>
        </Card>
      </div>

      {/* Recent messages */}
      <Card className="p-6">
        <h2 className="font-semibold flex items-center gap-2 mb-4">
          <Flag className="h-4 w-4" /> Recent messages
        </h2>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No messages yet — send some messages in your Telegram group</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold shrink-0">
                  {m.author?.split(" ").map((s: string) => s[0]).join("").slice(0, 2) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold">{m.author}</span>
                    <span className="text-muted-foreground">
                      {m.time ? new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5">{m.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default ChatDetail;
