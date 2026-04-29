import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SentimentBadge, PriorityBadge, StatusBadge, TimeAgo } from "@/components/Badges";
import {
  ArrowLeft, Hash, MessageSquare, Users, Sparkles, AlertCircle,
  HelpCircle, Flag, Inbox, Loader2, RefreshCw, Calendar, Star,
  ChevronDown, Clock, CheckCircle2, AlertTriangle, Activity,
  GitCommit, Handshake, Lightbulb, Target, Trophy, XCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import type { Chat, ActionItem, Message } from "@/lib/mock-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonalHighlight { message: string; from: string; time: string; }

interface SummaryData {
  id: string;
  summaryText?: string;
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

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  people: string[];
  dueDate?: string;
  occurredAt: string;
}

interface Commitment {
  id: string;
  person: string;
  commitment: string;
  dueDate?: string;
  status: string;
  createdAt: string;
}

interface RecurringIssue {
  id: string;
  topic: string;
  occurrences: number;
  firstSeenAt: string;
  lastSeenAt: string;
  examples: string[];
}

interface HealthData {
  health: { healthScore: number; healthLabel: string; healthUpdatedAt?: string };
  recurringIssues: RecurringIssue[];
}

interface ChatDetailData {
  chat?: Chat & { memberCount?: number; lastSummarizedAt?: string; healthScore?: number; healthLabel?: string };
  summaries?: SummaryData[];
  personalHighlights?: PersonalHighlight[];
  messages?: Message[];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d: Date): string { return d.toISOString().slice(0, 10); }
function today(): string { return toDateStr(new Date()); }
function daysAgo(n: number): string { const d = new Date(); d.setDate(d.getDate() - n); return toDateStr(d); }

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

const PRESETS = [
  { label: "Today",       from: () => today(),     to: () => today() },
  { label: "Yesterday",   from: () => daysAgo(1),  to: () => daysAgo(1) },
  { label: "Last 3 days", from: () => daysAgo(2),  to: () => today() },
  { label: "Last 7 days", from: () => daysAgo(6),  to: () => today() },
  { label: "Last 14 days",from: () => daysAgo(13), to: () => today() },
  { label: "Last 30 days",from: () => daysAgo(29), to: () => today() },
];

// ─── DateRangePicker ──────────────────────────────────────────────────────────

function DateRangePicker({ from, to, onChange }: { from: string; to: string; onChange: (f: string, t: string) => void }) {
  const [open, setOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState(from);
  const [tempTo, setTempTo] = useState(to);

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
        <div className="p-2 border-b">
          <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Quick select</p>
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => { onChange(p.from(), p.to()); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition ${p.from() === from && p.to() === to ? "bg-primary/10 text-primary font-medium" : ""}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="p-3 space-y-3">
          <p className="text-xs text-muted-foreground font-medium">Custom range</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">From</label>
              <input type="date" value={tempFrom} max={tempTo} onChange={e => setTempFrom(e.target.value)}
                className="w-full text-sm border rounded-md px-2 py-1.5 bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">To</label>
              <input type="date" value={tempTo} min={tempFrom} max={today()} onChange={e => setTempTo(e.target.value)}
                className="w-full text-sm border rounded-md px-2 py-1.5 bg-background" />
            </div>
          </div>
          <Button size="sm" className="w-full" onClick={() => { if (tempFrom > tempTo) { toast.error("Start must be before end"); return; } onChange(tempFrom, tempTo); setOpen(false); }}>
            Apply range
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Timeline icon/color ──────────────────────────────────────────────────────

const TIMELINE_CONFIG: Record<string, { icon: typeof Handshake; cls: string; label: string }> = {
  AGREEMENT:  { icon: Handshake,   cls: "bg-success/10 text-success border-success/20",       label: "Agreement" },
  DECISION:   { icon: Lightbulb,   cls: "bg-primary/10 text-primary border-primary/20",       label: "Decision" },
  DEADLINE:   { icon: Clock,       cls: "bg-warning/10 text-warning border-warning/20",       label: "Deadline" },
  COMMITMENT: { icon: GitCommit,   cls: "bg-blue-500/10 text-blue-500 border-blue-500/20",    label: "Commitment" },
  MILESTONE:  { icon: Trophy,      cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", label: "Milestone" },
  ISSUE:      { icon: AlertTriangle,cls: "bg-destructive/10 text-destructive border-destructive/20", label: "Issue" },
};

const HEALTH_CONFIG: Record<string, { cls: string; label: string; icon: typeof Activity }> = {
  HEALTHY:  { cls: "text-success border-success bg-success/10",       label: "Healthy",  icon: CheckCircle2 },
  AT_RISK:  { cls: "text-warning border-warning bg-warning/10",       label: "At risk",  icon: AlertTriangle },
  CRITICAL: { cls: "text-destructive border-destructive bg-destructive/10", label: "Critical", icon: XCircle },
};

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

  // Timeline state
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineType, setTimelineType] = useState("all");

  // Commitments state
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [commitmentsLoading, setCommitmentsLoading] = useState(false);

  // Health state
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Fetch chat + messages
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
          healthScore: rawChat.healthScore ?? null,
          healthLabel: rawChat.healthLabel ?? null,
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

  // Fetch summaries for date range
  useEffect(() => {
    if (!id || !data?.chat) return;
    let cancelled = false;
    setSummaryLoading(true);
    (async () => {
      try {
        const res = await apiFetch(`/api/chats/${encodeURIComponent(id)}/summaries?limit=60`);
        if (!res.ok) { if (!cancelled) setData(prev => prev ? { ...prev, summaries: [] } : prev); return; }
        const json: any = await res.json();
        const all: SummaryData[] = Array.isArray(json) ? json : (json?.summaries ?? []);
        const filtered = all.filter(s => { const d = s.date?.slice(0, 10) ?? ""; return d >= dateFrom && d <= dateTo; });
        if (!cancelled) setData(prev => prev ? { ...prev, summaries: filtered } : prev);
      } catch {
        if (!cancelled) setData(prev => prev ? { ...prev, summaries: [] } : prev);
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, dateFrom, dateTo, data?.chat]);

  // Fetch timeline
  const fetchTimeline = async () => {
    if (!id) return;
    setTimelineLoading(true);
    try {
      const params = new URLSearchParams();
      if (timelineType !== "all") params.set("type", timelineType);
      const res = await apiFetch(`/api/chats/${encodeURIComponent(id)}/timeline?${params}`);
      if (res.ok) { const json = await res.json(); setTimeline(json?.events ?? []); }
    } catch { setTimeline([]); }
    finally { setTimelineLoading(false); }
  };

  // Fetch commitments
  const fetchCommitments = async () => {
    if (!id) return;
    setCommitmentsLoading(true);
    try {
      const res = await apiFetch(`/api/chats/${encodeURIComponent(id)}/commitments`);
      if (res.ok) { const json = await res.json(); setCommitments(json?.commitments ?? []); }
    } catch { setCommitments([]); }
    finally { setCommitmentsLoading(false); }
  };

  // Fetch health
  const fetchHealth = async () => {
    if (!id) return;
    setHealthLoading(true);
    try {
      const res = await apiFetch(`/api/chats/${encodeURIComponent(id)}/health`);
      if (res.ok) setHealth(await res.json());
    } catch { setHealth(null); }
    finally { setHealthLoading(false); }
  };

  const handleTabChange = (tab: string) => {
    if (tab === "timeline" && timeline.length === 0) fetchTimeline();
    if (tab === "commitments" && commitments.length === 0) fetchCommitments();
    if (tab === "health" && !health) fetchHealth();
  };

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
      setDateFrom(today()); setDateTo(today());
      setData(prev => prev ? { ...prev, personalHighlights: body?.personalHighlights ?? [] } : prev);
      // Refresh timeline/commitments/health after new summary
      setTimeline([]); setCommitments([]); setHealth(null);
      toast.success("Summary generated!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  };

  const updateCommitmentStatus = async (commitmentId: string, newStatus: string) => {
    if (!id) return;
    try {
      const res = await apiFetch(`/api/chats/${id}/commitments/${commitmentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      setCommitments(prev => prev.map(c => c.id === commitmentId ? { ...c, status: newStatus } : c));
      toast.success("Updated");
    } catch { toast.error("Failed to update"); }
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
  const allActions = summaries.flatMap(s => s.actionItems ?? []);
  const allUnanswered = summaries.flatMap(s => s.unansweredQuestions ?? []);
  const isMultiDay = dateFrom !== dateTo;

  const healthCfg = HEALTH_CONFIG[(chat as any).healthLabel ?? "HEALTHY"];
  const HealthIcon = healthCfg.icon;

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
                {(chat as any).memberCount != null && (
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {(chat as any).memberCount} members</span>
                )}
                {chat.lastActivity && <span className="flex items-center gap-1">Last activity: <TimeAgo iso={chat.lastActivity} /></span>}
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {chat.messagesToday ?? 0} messages today</span>
                {(chat as any).lastSummarizedAt && (
                  <span className="text-xs flex items-center gap-1">Last summarized: <TimeAgo iso={(chat as any).lastSummarizedAt} /></span>
                )}
                {/* Health badge */}
                {(chat as any).healthLabel && (
                  <Badge variant="outline" className={`gap-1 ${healthCfg.cls}`}>
                    <HealthIcon className="h-3 w-3" />
                    {healthCfg.label} {(chat as any).healthScore != null ? `· ${(chat as any).healthScore}` : ""}
                  </Badge>
                )}
                <Badge variant="outline" className={chat.isActive ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}>
                  {chat.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-5">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="commitments">Commitments</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="messages" className="hidden md:flex">Messages</TabsTrigger>
        </TabsList>

        {/* ── Summary Tab ── */}
        <TabsContent value="summary" className="space-y-6 mt-4">
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary-glow/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h2 className="font-semibold">AI Summary</h2>
                  <div className="flex items-center gap-2">
                    <DateRangePicker from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
                    <Button size="sm" variant="outline" onClick={handleGenerateSummary} disabled={generating}>
                      {generating ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-2" />}
                      {generating ? "Generating..." : "Generate now"}
                    </Button>
                  </div>
                </div>

                {summaryLoading || generating ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{generating ? "Generating AI summary..." : "Loading..."}</span>
                  </div>
                ) : summaries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No summary for {formatDisplay(dateFrom, dateTo)}.
                    {dateFrom === today() && " Click \"Generate now\" to create one."}
                  </p>
                ) : isMultiDay ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">{summaries.length} summaries for {formatDisplay(dateFrom, dateTo)}</p>
                    {summaries.map(s => (
                      <div key={s.id} className="p-3 rounded-lg border border-primary/10 bg-background/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {s.date ? new Date(s.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : ""}
                          </span>
                          {s.sentiment && <SentimentBadge sentiment={s.sentiment as any} />}
                        </div>
                        <p className="text-sm">{s.noActivity ? "No activity." : (s.summaryText ?? "")}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed">{summaries[0].noActivity ? "No messages on this day." : (summaries[0].summaryText ?? "")}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {summaries[0].sentiment && <SentimentBadge sentiment={summaries[0].sentiment as any} />}
                      {summaries[0].requiresAttention && <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10 text-xs">Needs attention</Badge>}
                      {summaries[0].generatedAt && <span className="text-xs text-muted-foreground">Generated <TimeAgo iso={summaries[0].generatedAt} /></span>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

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
        </TabsContent>

        {/* ── Timeline Tab ── */}
        <TabsContent value="timeline" className="mt-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Timeline
              </h2>
              <div className="flex items-center gap-2">
                <select value={timelineType} onChange={e => setTimelineType(e.target.value)}
                  className="text-sm border rounded-md px-2 py-1.5 bg-background">
                  <option value="all">All types</option>
                  <option value="agreement">Agreements</option>
                  <option value="decision">Decisions</option>
                  <option value="deadline">Deadlines</option>
                  <option value="commitment">Commitments</option>
                  <option value="milestone">Milestones</option>
                  <option value="issue">Issues</option>
                </select>
                <Button variant="outline" size="sm" onClick={fetchTimeline} disabled={timelineLoading}>
                  <RefreshCw className={`h-3.5 w-3.5 ${timelineLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {timelineLoading ? (
              <div className="space-y-4">{[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : timeline.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No timeline events yet.</p>
                <p className="text-xs mt-1">Events are extracted automatically when you generate a summary.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {timeline.map((event) => {
                    const cfg = TIMELINE_CONFIG[event.type] ?? TIMELINE_CONFIG.ISSUE;
                    const Icon = cfg.icon;
                    return (
                      <div key={event.id} className="flex gap-4 pl-2">
                        <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-background ${cfg.cls}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{event.title}</span>
                                <Badge variant="outline" className={`text-xs ${cfg.cls}`}>{cfg.label}</Badge>
                              </div>
                              {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                              {event.people.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {event.people.map((p, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground shrink-0 text-right">
                              <div><TimeAgo iso={event.occurredAt} /></div>
                              {event.dueDate && (
                                <div className="text-warning mt-0.5">Due: {new Date(event.dueDate).toLocaleDateString()}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Commitments Tab ── */}
        <TabsContent value="commitments" className="mt-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold flex items-center gap-2">
                <GitCommit className="h-4 w-4" /> Commitments
              </h2>
              <Button variant="outline" size="sm" onClick={fetchCommitments} disabled={commitmentsLoading}>
                <RefreshCw className={`h-3.5 w-3.5 ${commitmentsLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {commitmentsLoading ? (
              <div className="space-y-3">{[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : commitments.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No commitments detected yet.</p>
                <p className="text-xs mt-1">Commitments are extracted when someone says "I'll do X by Y date."</p>
              </div>
            ) : (
              <div className="space-y-3">
                {commitments.map(c => {
                  const isOpen = c.status === "OPEN" || c.status === "OVERDUE";
                  return (
                    <div key={c.id} className={`p-4 rounded-lg border ${c.status === "OVERDUE" ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-primary">{c.person}</span>
                            <Badge variant="outline" className={
                              c.status === "COMPLETED" ? "text-success border-success/30 bg-success/10 text-xs" :
                              c.status === "OVERDUE" ? "text-destructive border-destructive/30 bg-destructive/10 text-xs" :
                              c.status === "CANCELLED" ? "text-muted-foreground text-xs" :
                              "text-primary border-primary/30 bg-primary/10 text-xs"
                            }>{c.status}</Badge>
                          </div>
                          <p className="text-sm">{c.commitment}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {c.dueDate && <span className={c.status === "OVERDUE" ? "text-destructive" : ""}>Due: {new Date(c.dueDate).toLocaleDateString()}</span>}
                            <TimeAgo iso={c.createdAt} />
                          </div>
                        </div>
                        {isOpen && (
                          <Button size="sm" variant="outline" onClick={() => updateCommitmentStatus(c.id, "COMPLETED")} className="shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Done
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Health Tab ── */}
        <TabsContent value="health" className="mt-4 space-y-4">
          {healthLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !health ? (
            <Card className="p-12 text-center text-muted-foreground">
              <Activity className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No health data yet.</p>
              <p className="text-xs mt-1">Generate a summary to calculate the health score.</p>
              <Button size="sm" className="mt-4" onClick={fetchHealth}><RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh</Button>
            </Card>
          ) : (
            <>
              {/* Score card */}
              <Card className="p-6">
                <div className="flex items-center gap-6">
                  <div className="relative h-24 w-24 shrink-0">
                    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none"
                        stroke={health.health.healthLabel === "HEALTHY" ? "hsl(142 76% 36%)" : health.health.healthLabel === "AT_RISK" ? "hsl(38 92% 50%)" : "hsl(var(--destructive))"}
                        strokeWidth="3"
                        strokeDasharray={`${health.health.healthScore} 100`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{health.health.healthScore}</span>
                      <span className="text-xs text-muted-foreground">/100</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold">Chat Health</h2>
                      <Badge variant="outline" className={`${healthCfg.cls} gap-1`}>
                        <HealthIcon className="h-3 w-3" /> {healthCfg.label}
                      </Badge>
                    </div>
                    {health.health.healthUpdatedAt && (
                      <p className="text-xs text-muted-foreground">Updated <TimeAgo iso={health.health.healthUpdatedAt} /></p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {health.health.healthLabel === "HEALTHY" ? "This chat is active and well-managed." :
                       health.health.healthLabel === "AT_RISK" ? "Some issues need attention to stay on track." :
                       "This chat needs immediate attention."}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Recurring issues */}
              {health.recurringIssues.length > 0 && (
                <Card className="p-6">
                  <h2 className="font-semibold flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-4 w-4 text-warning" /> Recurring Issues
                    <Badge variant="secondary" className="text-xs">{health.recurringIssues.length}</Badge>
                  </h2>
                  <div className="space-y-3">
                    {health.recurringIssues.map(issue => (
                      <div key={issue.id} className="p-4 rounded-lg border border-warning/20 bg-warning/5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{issue.topic}</p>
                          <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10 text-xs shrink-0">
                            {issue.occurrences}× this week
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          First seen <TimeAgo iso={issue.firstSeenAt} /> · Last seen <TimeAgo iso={issue.lastSeenAt} />
                        </div>
                        {(issue.examples as string[]).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-2 italic">"{(issue.examples as string[])[0]}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ── Messages Tab ── */}
        <TabsContent value="messages" className="mt-4">
          <Card className="p-6">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Flag className="h-4 w-4" /> Recent messages
            </h2>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No messages yet</p>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatDetail;
