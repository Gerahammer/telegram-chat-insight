import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AttentionBadge, SentimentBadge, PriorityBadge, StatusBadge, TimeAgo } from "@/components/Badges";
import {
  ArrowLeft, Hash, MessageSquare, Users, Sparkles, AlertCircle,
  HelpCircle, Flag, Inbox, Loader2, RefreshCw, Calendar, Star, ChevronDown,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import type { Chat, ActionItem, Message } from "@/lib/mock-data";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

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
  summaries?: SummaryData[];
  personalHighlights?: PersonalHighlight[];
  messages?: Message[];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function today(): string { return toDateStr(new Date()); }

function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); return toDateStr(d);
}

function formatDisplay(from: string, to: string): string {
  if (from === to) {
    if (from === today()) return "Today";
    if (from === daysAgo(1)) return "Yesterday";
    return new Date(from).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  const f = new Date(from).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const t = new Date(to).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${f} – ${t}`;
}

// Quick range presets
const PRESETS = [
  { label: "Today",      from: () => today(),    to: () => today() },
  { label: "Yesterday",  from: () => daysAgo(1), to: () => daysAgo(1) },
  { label: "Last 3 days",from: () => daysAgo(2), to: () => today() },
  { label: "Last 7 days",from: () => daysAgo(6), to: () => today() },
  { label: "Last 14 days",from: () => daysAgo(13),to: () => today() },
  { label: "Last 30 days",from: () => daysAgo(29),to: () => today() },
];

// ─── DateRangePicker ──────────────────────────────────────────────────────────

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState(from);
  const [tempTo, setTempTo] = useState(to);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const f = preset.from(); const t = preset.to();
    onChange(f, t);
    setTempFrom(f); setTempTo(t);
    setOpen(false);
  };

  const applyCustom = () => {
    if (tempFrom > tempTo) { toast.error("Start date must be before end date"); return; }
    onChange(tempFrom, tempTo);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="h-3.5 w-3.5" />
          {formatDisplay(from, to)}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        {/* Presets */}
        <div className="p-2 border-b">
          <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Quick select</p>
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition ${
                p.label === formatDisplay(from, to) || (p.from() === from && p.to() === to)
                  ? "bg-primary/10 text-primary font-medium"
                  : ""
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {/* Custom range */}
        <div className="p-3 space-y-3">
          <p className="text-xs text-muted-foreground font-medium">Custom range</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">From</label>
              <input
                type="date"
                value={tempFrom}
                max={tempTo}
                onChange={e => setTempFrom(e.target.value)}
                className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To</label>
              <input
                type="date"
                value={tempTo}
                min={tempFrom}
                max={today()}
                onChange={e => setTempTo(e.target.value)}
                className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
              />
            </div>
          </div>
          <Button size="sm" className="w-full" onClick={applyCustom}>
            Apply range
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const ChatDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState<ChatDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());

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

  // Fetch summaries for selected date range
  useEffect(() => {
    if (!id || !data?.chat) return;
    let cancelled = false;
    setSummaryLoading(true);

    (async () => {
      try {
        // Fetch all summaries in range by getting paginated results
        // For a range, we fetch without date filter and filter client-side
        const res = await apiFetch(`/api/chats/${encodeURIComponent(id)}/summaries?limit=60`);
        if (!res.ok) { if (!cancelled) setData(prev => prev ? { ...prev, summaries: [] } : prev); return; }

        const json: any = await res.json();
        const all: SummaryData[] = Array.isArray(json) ? json : (json?.summaries ?? []);

        // Filter by date range
        const filtered = all.filter(s => {
          const d = s.date?.slice(0, 10) ?? "";
          return d >= dateFrom && d <= dateTo;
        });

        if (!cancelled) setData(prev => prev ? { ...prev, summaries: filtered } : prev);
      } catch {
        if (!cancelled) setData(prev => prev ? { ...prev, summaries: [] } : prev);
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, dateFrom, dateTo, data?.chat]);

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

      // Reset to today and reload
      setDateFrom(today()); setDateTo(today());
      setData(prev => prev ? {
        ...prev,
        personalHighlights: body?.personalHighlights ?? [],
      } : prev);

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
        <div className="grid lg:grid-cols-2 gap-6"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>
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
  const summaries = data.summaries ?? [];
  const personalHighlights = data.personalHighlights ?? [];

  // Merge action items and unanswered questions across all summaries in range
  const allActions = summaries.flatMap(s => s.actionItems ?? []);
  const allUnanswered = summaries.flatMap(s => s.unansweredQuestions ?? []);

  // Combined summary text for range (show each day separately or merged)
  const isMultiDay = dateFrom !== dateTo;

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
                {chat.type && <Badge variant="secondary" className="capitalize">{String(chat.type).toLowerCase()}</Badge>}
                {chat.memberCount != null && (
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {chat.memberCount} members</span>
                )}
                {chat.lastActivity && (
                  <span className="flex items-center gap-1">Last activity: <TimeAgo iso={chat.lastActivity} /></span>
                )}
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> {chat.messagesToday ?? 0} messages today
                </span>
                {(chat as any).lastSummarizedAt && (
                  <span className="text-xs flex items-center gap-1">
                    Last summarized: <TimeAgo iso={(chat as any).lastSummarizedAt} />
                  </span>
                )}
                <Badge variant="outline" className={chat.isActive ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                  {chat.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary card */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className="font-semibold">AI Summary</h2>
              <div className="flex items-center gap-2">
                <DateRangePicker
                  from={dateFrom}
                  to={dateTo}
                  onChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
                />
                <Button size="sm" variant="outline" onClick={handleGenerateSummary} disabled={generating}>
                  {generating
                    ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    : <RefreshCw className="h-3.5 w-3.5 mr-2" />}
                  {generating ? "Generating..." : "Generate now"}
                </Button>
              </div>
            </div>

            {summaryLoading || generating ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{generating ? "Generating AI summary..." : "Loading summaries..."}</span>
              </div>
            ) : summaries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No summaries found for {formatDisplay(dateFrom, dateTo)}.
                {dateFrom === today() && " Click \"Generate now\" to create one."}
              </p>
            ) : isMultiDay ? (
              // Multi-day: show each day as a card
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">{summaries.length} summaries for {formatDisplay(dateFrom, dateTo)}</p>
                {summaries.map(s => (
                  <div key={s.id} className="p-3 rounded-lg border border-primary/10 bg-background/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {s.date ? new Date(s.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : ""}
                      </span>
                      <div className="flex gap-1">
                        {s.sentiment && <SentimentBadge sentiment={s.sentiment as any} />}
                        {s.requiresAttention && <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10 text-xs">Needs attention</Badge>}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">
                      {s.noActivity ? "No activity on this day." : (s.summaryText ?? s.summary ?? "")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              // Single day
              <>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {summaries[0].noActivity
                    ? "No messages recorded on this day."
                    : (summaries[0].summaryText ?? summaries[0].summary ?? "")}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {summaries[0].sentiment && <SentimentBadge sentiment={summaries[0].sentiment as any} />}
                  {summaries[0].requiresAttention && (
                    <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10 text-xs">Needs attention</Badge>
                  )}
                  {summaries[0].generatedAt && (
                    <span className="text-xs text-muted-foreground">Generated <TimeAgo iso={summaries[0].generatedAt} /></span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Personal Highlights */}
      {personalHighlights.length > 0 && (
        <Card className="p-6 border-primary/30">
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
            {allActions.length > 0 && <Badge variant="secondary" className="text-xs">{allActions.length}</Badge>}
          </h2>
          <div className="space-y-2">
            {allActions.length === 0
              ? <p className="text-sm text-muted-foreground">No action items for this period.</p>
              : allActions.map((a: any, i: number) => (
                <div key={a.id ?? i} className="p-3 rounded-lg border border-border">
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
            {allUnanswered.length > 0 && <Badge variant="secondary" className="text-xs">{allUnanswered.length}</Badge>}
          </h2>
          <div className="space-y-2">
            {allUnanswered.length === 0
              ? <p className="text-sm text-muted-foreground">No unanswered questions.</p>
              : allUnanswered.map((q, i) => (
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
