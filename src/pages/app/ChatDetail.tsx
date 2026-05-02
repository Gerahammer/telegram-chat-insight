import { UserAvatar } from "@/components/UserAvatar";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SentimentBadge, PriorityBadge, StatusBadge, TimeAgo } from "@/components/Badges";
import {
  ArrowLeft, Hash, MessageSquare, Users, Sparkles, AlertCircle,
  HelpCircle, Flag, Inbox, Loader2, RefreshCw, Calendar, Star,
  ChevronDown, Clock, CheckCircle2, AlertTriangle, Activity,
  GitCommit, Handshake, Lightbulb, Target, Trophy, XCircle,
  ChevronRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ChatPhoto } from "@/components/ChatPhoto";
import { toast } from "sonner";
import type { Chat, ActionItem, Message } from "@/lib/mock-data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PersonalHighlight { message: string; from: string; time: string; }
interface SummaryData {
  id: string; summaryText?: string; requiresAttention?: boolean;
  priority?: string; sentiment?: string; unansweredQuestions?: string[];
  urgentIssues?: string[]; actionItems?: ActionItem[];
  generatedAt?: string; date?: string; noActivity?: boolean;
}
interface TimelineEvent {
  id: string; type: string; title: string; description?: string;
  people: string[]; dueDate?: string; occurredAt: string;
}
interface Commitment {
  id: string; person: string; commitment: string;
  dueDate?: string; status: string; createdAt: string;
}
interface RecurringIssue {
  id: string; topic: string; occurrences: number;
  firstSeenAt: string; lastSeenAt: string; examples: string[];
}
interface HealthData {
  health: { healthScore: number; healthLabel: string; healthUpdatedAt?: string };
  recurringIssues: RecurringIssue[];
}
interface ChatData {
  chat?: Chat & { memberCount?: number; lastSummarizedAt?: string; healthScore?: number; healthLabel?: string };
  summaries?: SummaryData[];
  personalHighlights?: PersonalHighlight[];
  messages?: Message[];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d: Date) { return d.toISOString().slice(0, 10); }
function today() { return toDateStr(new Date()); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return toDateStr(d); }
function formatDisplay(from: string, to: string) {
  if (from === to) {
    if (from === today()) return "Today";
    if (from === daysAgo(1)) return "Yesterday";
    return new Date(from).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  }
  return `${new Date(from).toLocaleDateString("en-GB", { month: "short", day: "numeric" })} – ${new Date(to).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`;
}
const PRESETS = [
  { label: "Today",        from: today,          to: today },
  { label: "Yesterday",    from: () => daysAgo(1), to: () => daysAgo(1) },
  { label: "Last 3 days",  from: () => daysAgo(2), to: today },
  { label: "Last 7 days",  from: () => daysAgo(6), to: today },
  { label: "Last 14 days", from: () => daysAgo(13), to: today },
  { label: "Last 30 days", from: () => daysAgo(29), to: today },
];

function DateRangePicker({ from, to, onChange }: { from: string; to: string; onChange: (f: string, t: string) => void }) {
  const [open, setOpen] = useState(false);
  const [tf, setTf] = useState(from);
  const [tt, setTt] = useState(to);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <Calendar className="h-3.5 w-3.5" />
          {formatDisplay(from, to)}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-68 p-0">
        <div className="p-2 border-b">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => { onChange(p.from(), p.to()); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-muted transition ${p.from() === from && p.to() === to ? "bg-primary/10 text-primary font-medium" : ""}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">From</label>
              <input type="date" value={tf} max={tt} onChange={e => setTf(e.target.value)}
                className="w-full text-xs border rounded px-2 py-1.5 bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">To</label>
              <input type="date" value={tt} min={tf} max={today()} onChange={e => setTt(e.target.value)}
                className="w-full text-xs border rounded px-2 py-1.5 bg-background" />
            </div>
          </div>
          <Button size="sm" className="w-full" onClick={() => { if (tf > tt) { toast.error("Start must be before end"); return; } onChange(tf, tt); setOpen(false); }}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Timeline config ──────────────────────────────────────────────────────────

const TL: Record<string, { icon: any; cls: string; label: string }> = {
  AGREEMENT:  { icon: Handshake,    cls: "bg-success/10 text-success border-success/20",           label: "Agreement" },
  DECISION:   { icon: Lightbulb,    cls: "bg-primary/10 text-primary border-primary/20",           label: "Decision" },
  DEADLINE:   { icon: Clock,        cls: "bg-warning/10 text-warning border-warning/20",           label: "Deadline" },
  COMMITMENT: { icon: GitCommit,    cls: "bg-blue-500/10 text-blue-500 border-blue-500/20",        label: "Commitment" },
  MILESTONE:  { icon: Trophy,       cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",  label: "Milestone" },
  ISSUE:      { icon: AlertTriangle,cls: "bg-destructive/10 text-destructive border-destructive/20",label: "Issue" },
};

const HC: Record<string, { cls: string; label: string; icon: any }> = {
  HEALTHY:  { cls: "text-success border-success bg-success/10",            label: "Healthy",  icon: CheckCircle2 },
  AT_RISK:  { cls: "text-warning border-warning bg-warning/10",            label: "At risk",  icon: AlertTriangle },
  CRITICAL: { cls: "text-destructive border-destructive bg-destructive/10",label: "Critical", icon: XCircle },
};

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, count, action }: { icon: any; title: string; count?: number; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-semibold flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
        {count != null && count > 0 && <Badge variant="secondary" className="text-xs">{count}</Badge>}
      </h2>
      {action}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ChatDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [sideLoading, setSideLoading] = useState(false);
  const [askQuestion, setAskQuestion] = useState("");
  const [summaryTab, setSummaryTab] = useState<"overall" | "users">("overall");
  const [askHistory, setAskHistory] = useState<{question: string; answer: string; askedAt?: string}[]>(() => {
    try {
      const saved = localStorage.getItem(`askHistory-${id}`);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [askSlide, setAskSlide] = useState(0);
  const [askLoading, setAskLoading] = useState(false);
  const [askRemaining, setAskRemaining] = useState<number | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  const fetchMessages = async () => {
    if (!id) return;
    try {
      const res = await apiFetch(`/api/chats/${encodeURIComponent(id!)}/messages`);
      if (!res.ok) return;
      const mj: any = await res.json();
      const raw2 = Array.isArray(mj) ? mj : (mj?.messages ?? []);
      const msgs = raw2.map((m: any) => ({
        id: String(m.id ?? crypto.randomUUID()),
        author: m.senderName ?? m.author ?? "Unknown",
        text: m.text ?? "",
        time: m.sentAt ?? m.time ?? "",
        audioUrl: m.audioUrl ?? null,
        flagged: false,
      }));
      setData(prev => prev ? { ...prev, messages: msgs } : prev);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [id]);

  // Load chat + messages
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
        const raw = json?.chat ?? json;
        const chat = raw ? {
          ...raw,
          name: raw.title ?? raw.name ?? "Untitled",
          type: raw.chatType ?? raw.type,
          messagesToday: raw.messageCount ?? 0,
          lastActivity: raw.lastActivityAt,
          memberCount: raw.memberCount ?? null,
          lastSummarizedAt: raw.lastSummarizedAt ?? null,
          healthScore: raw.healthScore ?? null,
          healthLabel: raw.healthLabel ?? null,
        } : undefined;
        let messages: Message[] = [];
        if (msgRes.ok) {
          try {
            const mj: any = await msgRes.json();
            const raw2 = Array.isArray(mj) ? mj : (mj?.messages ?? []);
            messages = raw2.map((m: any) => ({
              id: String(m.id ?? crypto.randomUUID()),
              author: m.senderName ?? m.author ?? "Unknown",
              text: m.text ?? "",
              time: m.sentAt ?? m.time ?? "",
              audioUrl: m.audioUrl ?? null,
              flagged: false,
            }));
          } catch { messages = []; }
        }
        if (!cancelled) setData({ chat, messages });
      } catch { if (!cancelled) setNotFound(true); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Load summaries for date range
  useEffect(() => {
    if (!id || !data?.chat) return;
    let cancelled = false;
    setSummaryLoading(true);
    (async () => {
      try {
        const res = await apiFetch(`/api/chats/${encodeURIComponent(id)}/summaries?limit=60`);
        if (!res.ok) { if (!cancelled) setData(p => p ? { ...p, summaries: [] } : p); return; }
        const json: any = await res.json();
        const all: SummaryData[] = Array.isArray(json) ? json : (json?.summaries ?? []);
        const filtered = all.filter(s => { const d = s.date?.slice(0, 10) ?? ""; return d >= dateFrom && d <= dateTo; });
        if (!cancelled) setData(p => p ? { ...p, summaries: filtered } : p);
      } catch { if (!cancelled) setData(p => p ? { ...p, summaries: [] } : p); }
      finally { if (!cancelled) setSummaryLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id, dateFrom, dateTo, data?.chat]);

  // Load timeline + commitments + health in background
  useEffect(() => {
    if (!id || !data?.chat) return;
    setSideLoading(true);
    Promise.all([
      apiFetch(`/api/chats/${encodeURIComponent(id)}/timeline`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/chats/${encodeURIComponent(id)}/commitments`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/chats/${encodeURIComponent(id)}/health`).then(r => r.ok ? r.json() : null),
    ]).then(([tl, cm, hl]) => {
      setTimeline(tl?.events ?? []);
      setCommitments(cm?.commitments ?? []);
      setHealth(hl ?? null);
    }).catch(() => {}).finally(() => setSideLoading(false));
  }, [id, data?.chat]);

  const handleGenerate = async (force = false) => {
    if (!id || generating) return;
    setGenerating(true);
    try {
      const res = await apiFetch(`/api/chats/${encodeURIComponent(id)}/generate-summary${force ? "?force=true" : ""}`, { method: "POST" });
      let body: any = null;
      try { const t = await res.text(); body = t ? JSON.parse(t) : null; } catch {}
      if (!res.ok) {
        const msg = body?.message ?? body?.error ?? "";
        if (res.status === 429) toast.error("Recently generated. Please wait before generating again.");
        else if (res.status === 400) toast.error("No messages in the last 24 hours.");
        else toast.error(msg || `Failed (${res.status})`);
        return;
      }
      setDateFrom(today()); setDateTo(today());
      setData(p => p ? { ...p, personalHighlights: body?.personalHighlights ?? [] } : p);
      // Reload summaries from API to get clean saved data (no temp AI output)
      apiFetch(`/api/chats/${encodeURIComponent(id)}/summaries?limit=60`)
        .then(r => r.ok ? r.json() : null)
        .then(json => {
          if (!json) return;
          const all = Array.isArray(json) ? json : (json?.summaries ?? []);
          const t = today();
          const filtered = all.filter((s: any) => s.date?.slice(0, 10) === t);
          setData(p => p ? { ...p, summaries: filtered } : p);
        }).catch(() => {});
      // Reload side data
      Promise.all([
        apiFetch(`/api/chats/${encodeURIComponent(id)}/timeline`).then(r => r.ok ? r.json() : null),
        apiFetch(`/api/chats/${encodeURIComponent(id)}/commitments`).then(r => r.ok ? r.json() : null),
        apiFetch(`/api/chats/${encodeURIComponent(id)}/health`).then(r => r.ok ? r.json() : null),
      ]).then(([tl, cm, hl]) => {
        setTimeline(tl?.events ?? []);
        setCommitments(cm?.commitments ?? []);
        setHealth(hl ?? null);
      }).catch(() => {});
      toast.success("Summary generated!");
    } catch (err: any) { toast.error(err?.message || "Failed"); }
    finally { setGenerating(false); }
  };

  const markCommitmentDone = async (cid: string) => {
    if (!id) return;
    try {
      const res = await apiFetch(`/api/chats/${id}/commitments/${cid}`, { method: "PATCH", body: JSON.stringify({ status: "COMPLETED" }) });
      if (!res.ok) throw new Error();
      setCommitments(p => p.map(c => c.id === cid ? { ...c, status: "COMPLETED" } : c));
      toast.success("Marked as done");
    } catch { toast.error("Failed to update"); }
  };

  const handleAsk = async () => {
    if (!id || !askQuestion.trim() || askLoading) return;
    setAskLoading(true);
    
    setAskError(null);
    try {
      const res = await apiFetch(`/api/chats/${encodeURIComponent(id)}/ask`, {
        method: "POST",
        body: JSON.stringify({ question: askQuestion }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAskError(data.message ?? data.error ?? "Failed");
      } else {
        setAskHistory(prev => {
          const next = [{question: askQuestion, answer: data.answer, askedAt: new Date().toISOString()}, ...prev].slice(0, 5);
          try { localStorage.setItem(`askHistory-${id}`, JSON.stringify(next)); } catch {}
          return next;
        });
        setAskSlide(0);
        setAskRemaining(data.remaining);
        setAskQuestion("");
      }
    } catch {
      setAskError("Request failed");
    } finally {
      setAskLoading(false);
    }
  };

  if (loading) return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32 w-full" />
      <div className="grid lg:grid-cols-3 gap-6"><Skeleton className="h-64 w-full lg:col-span-2" /><Skeleton className="h-64 w-full" /></div>
    </div>
  );

  if (notFound || !data?.chat) return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <Button variant="ghost" size="sm" asChild><Link to="/app/chats"><ArrowLeft className="h-4 w-4 mr-2" />All chats</Link></Button>
      <Card className="p-12 text-center text-muted-foreground">
        <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Chat not available.</p>
      </Card>
    </div>
  );

  const chat = data.chat;
  const messages = data.messages ?? [];
  const summaries = data.summaries ?? [];
  const personalHighlights = data.personalHighlights ?? [];
  const allActions = summaries.flatMap(s => s.actionItems ?? []);
  const allUnanswered = summaries.flatMap(s =>
    (s.unansweredQuestions ?? []).map((q, i) => ({ q, summaryId: s.id, index: i }))
  );
  const isMultiDay = dateFrom !== dateTo;
  const healthCfg = HC[(chat as any).healthLabel ?? "HEALTHY"];
  const HealthIcon = healthCfg.icon;
  const openCommitments = commitments.filter(c => c.status === "OPEN" || c.status === "OVERDUE");

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">

      {/* ── Header ── */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link to="/app/chats"><ArrowLeft className="h-4 w-4 mr-2" />All chats</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <ChatPhoto photoUrl={(chat as any).photoUrl} title={chat.name} size="lg" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{chat.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                {chat.type && <Badge variant="secondary" className="capitalize text-xs">{String(chat.type).toLowerCase()}</Badge>}
                {(chat as any).memberCount != null && <span className="flex items-center gap-1 text-xs"><Users className="h-3 w-3" />{(chat as any).memberCount} members</span>}
                {chat.lastActivity && <span className="text-xs text-muted-foreground">Active <TimeAgo iso={chat.lastActivity} /></span>}
                {(chat as any).lastSummarizedAt && <span className="text-xs text-muted-foreground">Summarized <TimeAgo iso={(chat as any).lastSummarizedAt} /></span>}
                {(chat as any).lastCheckedAt && <span className="text-xs text-muted-foreground">Checked <TimeAgo iso={(chat as any).lastCheckedAt} /></span>}
                {(chat as any).healthLabel && (
                  <Badge variant="outline" className={`gap-1 text-xs ${healthCfg.cls}`}>
                    <HealthIcon className="h-3 w-3" />{healthCfg.label} {(chat as any).healthScore != null ? `· ${(chat as any).healthScore}` : ""}
                  </Badge>
                )}
                <Badge variant="outline" className={`text-xs ${chat.isActive ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground"}`}>
                  {chat.isActive ? "Active" : "Inactive"}
                </Badge>
                {(chat as any).telegramChatId && (
                  <a
                    href={'https://web.telegram.org/k/#' + String((chat as any).telegramChatId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1 text-primary hover:underline"
                  >
                    Open in Telegram ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main 2-column layout ── */}
      <div className="grid xl:grid-cols-3 gap-6">

        {/* LEFT: Summary + Personal + Actions + Unanswered (2/3 width) */}
        <div className="xl:col-span-2 space-y-6">

          {/* AI Summary */}
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
                    <Button size="sm" variant="outline" onClick={() => handleGenerate()} disabled={generating} className="h-8">
                      {generating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
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
                            {s.date ? new Date(s.date).toLocaleDateString("en-GB", { weekday: "short", month: "short", day: "numeric" }) : ""}
                          </span>
                          {s.sentiment && <SentimentBadge sentiment={s.sentiment as any} />}
                        </div>
                        <p className="text-sm">{s.noActivity ? "No activity." : (s.summaryText ?? "")}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="text-sm leading-relaxed space-y-1 max-h-48 overflow-y-auto pr-1">
                      {summaries[0].noActivity ? "No messages on this day." :
                        (summaries[0].summaryText ?? "").split("•").filter(Boolean).map((point, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-primary shrink-0">•</span>
                            <span>{point.trim()}</span>
                          </div>
                        ))
                      }
                    </div>
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

          {/* Personal highlights */}
          {personalHighlights.length > 0 && (
            <Card className="p-5 border-primary/30">
              <SectionHeader icon={Star} title="For you" count={personalHighlights.length} />
              <div className="space-y-2">
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

          {/* Action items + Unanswered questions side by side */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5">
              <SectionHeader icon={AlertCircle} title="Action items" count={allActions.filter((a:any) => !["resolved","dismissed"].includes((a.status??"").toLowerCase())).length} />
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {allActions.filter((a:any) => !["resolved","dismissed"].includes((a.status??"").toLowerCase())).length === 0
                  ? <p className="text-sm text-muted-foreground">No action items for this period.</p>
                  : allActions.filter((a:any) => !["resolved","dismissed"].includes((a.status??"").toLowerCase())).slice(0,10).map((a: any, i: number) => {
                    const isResolved = ["resolved","dismissed"].includes((a.status ?? "").toLowerCase());
                    return (
                    <div key={a.id ?? i} className={`p-3 rounded-lg border border-border ${isResolved ? "opacity-50" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm">{a.title}</div>
                        <div className="flex items-center gap-1">
                          {a.priority && <PriorityBadge priority={a.priority} />}
                          {!isResolved && a.id && (
                            <button
                              onClick={async () => {
                                try {
                                  const res = await apiFetch(`/api/action-items/${a.id}`, {method:"PATCH", body: JSON.stringify({status:"RESOLVED"})});
                                  if (res.ok) {
                                    setData(p => p ? {...p, summaries: p.summaries?.map(s => ({...s, actionItems: s.actionItems?.filter((ai: any) => ai.id !== a.id)}))} : p);
                                    toast.success("Action item resolved", {
                                      action: { label: "Undo", onClick: async () => {
                                        await apiFetch(`/api/action-items/${a.id}`, {method:"PATCH", body: JSON.stringify({status:"OPEN"})});
                                        setData(p => p ? {...p, summaries: p.summaries?.map(s => ({...s, actionItems: [...(s.actionItems ?? []), {...a, status: "OPEN"}]}))} : p);
                                      }},
                                      duration: 300000,
                                    });
                                  }
                                } catch {}
                              }}
                              className="text-xs text-muted-foreground hover:text-success transition px-1.5 py-0.5 rounded border border-border hover:border-success"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      </div>
                      {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                      <div className="mt-2 flex items-center gap-2">
                        {a.status && <StatusBadge status={a.status} />}
                        {a.requestedBy && <span className="text-xs text-muted-foreground">by {a.requestedBy}</span>}
                      </div>
                    </div>
                    );
                  })}
              </div>
            </Card>

            <Card className="p-5">
              <SectionHeader icon={HelpCircle} title="Unanswered" count={allUnanswered.length} />
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {allUnanswered.length === 0
                  ? <p className="text-sm text-muted-foreground">No unanswered questions.</p>
                  : allUnanswered.map((item, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border bg-warning/5 flex items-start justify-between gap-2">
                      <p className="text-sm flex-1">{item.q}</p>
                      <button
                        onClick={async () => {
                          if (!id) return;
                          try {
                            const res = await apiFetch(`/api/chats/${id}/summaries/${item.summaryId}/unanswered`, {
                              method: "PATCH",
                              body: JSON.stringify({ index: item.index }),
                            });
                            if (res.ok) {
                              setData(prev => prev ? {
                                ...prev,
                                summaries: prev.summaries?.map(s =>
                                  s.id === item.summaryId
                                    ? { ...s, unansweredQuestions: (s.unansweredQuestions ?? []).filter((_, idx) => idx !== item.index) }
                                    : s
                                )
                              } : prev);
                            }
                          } catch {}
                        }}
                        className="text-xs text-muted-foreground hover:text-success transition shrink-0 mt-0.5"
                        title="Mark as answered"
                      >
                        ✓ Answered
                      </button>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* AI Search */}
          <Card className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <SectionHeader icon={Sparkles} title="Ask AI about this chat" />
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={askQuestion}
                onChange={e => setAskQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAsk()}
                placeholder="What did Dan suggest about rates? When was the invoice discussed?"
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary transition"
              />
              <Button size="sm" onClick={handleAsk} disabled={askLoading || !askQuestion.trim()} className="shrink-0">
                {askLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
              </Button>
            </div>
            {askRemaining !== null && (
              <p className="text-xs text-muted-foreground mb-2">{askRemaining} searches remaining this hour</p>
            )}
            {askError && <p className="text-sm text-destructive mb-2">{askError}</p>}
            {askHistory.length > 0 && (
              <div className="relative">
                <div className="overflow-hidden rounded-lg border border-primary/20 bg-background">
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${askSlide * 100}%)` }}
                  >
                    {askHistory.map((item, i) => (
                      <div key={i} className="min-w-full p-3">
                        <div className="flex items-center justify-between mb-1"><p className="text-xs font-medium text-muted-foreground">Q: {item.question}</p>{item.askedAt && <span className="text-xs text-muted-foreground shrink-0 ml-2">{new Date(item.askedAt).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span>}</div>
                        <p className="text-sm leading-relaxed">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {askHistory.length > 1 && (
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={() => setAskSlide(s => Math.max(0, s - 1))}
                      disabled={askSlide === 0}
                      className="text-xs text-muted-foreground hover:text-primary disabled:opacity-30 transition">← Prev</button>
                    <span className="text-xs text-muted-foreground">{askSlide + 1} / {askHistory.length}</span>
                    <button onClick={() => setAskSlide(s => Math.min(askHistory.length - 1, s + 1))}
                      disabled={askSlide === askHistory.length - 1}
                      className="text-xs text-muted-foreground hover:text-primary disabled:opacity-30 transition">Next →</button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Recent messages */}
          <Card className="p-5">
            <SectionHeader icon={Flag} title="Recent messages" count={messages.length} />
            {messages.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {messages.reduce((acc: any[], m, i) => {
                  const msgDate = m.time ? new Date(m.time).toLocaleDateString("en-GB") : "";
                  const prevDate = i > 0 && messages[i-1].time ? new Date(messages[i-1].time).toLocaleDateString("en-GB") : "";
                  if (msgDate !== prevDate) {
                    acc.push(<div key={"sep"+i} className="flex items-center gap-2 my-1"><div className="flex-1 h-px bg-border"/><span className="text-xs text-muted-foreground shrink-0 px-2">{msgDate}</span><div className="flex-1 h-px bg-border"/></div>);
                  }
                  const text = m.text ?? "";
                  const isQ = text.includes("?");
                  const isCom = /\b(i will|i'll|will do|tomorrow|by monday|by tuesday|by friday|by \d)\b/i.test(text);
                  const isUnans = allUnanswered.some(u => u.q && text.toLowerCase().startsWith(u.q.toLowerCase().slice(0, 25)));
                  acc.push(
                    <div key={m.id} className="flex gap-3">
                      <UserAvatar name={m.author} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="font-semibold">{m.author}</span>
                          <span className="text-muted-foreground">
                            {m.time ? new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                          {isUnans && <span className="px-1.5 py-0.5 rounded-full bg-warning/10 text-warning text-xs">Unanswered</span>}
                          {isCom && !isUnans && <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs">Commitment</span>}
                          {isQ && !isUnans && !isCom && <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">Question</span>}
                        </div>
                        {(() => {
                          const txt = m.text ?? "";
                          if (txt.startsWith("[Voice]")) {
                            const summary = txt.replace("[Voice]", "").trim();
                            const proxyAudio = (m as any).audioUrl
                              ? `https://seahorse-app-47666.ondigitalocean.app/api/proxy/audio?url=${encodeURIComponent((m as any).audioUrl)}`
                              : null;
                            return (
                              <div className="mt-0.5">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-muted-foreground">🎤 Voice</span>
                                  {proxyAudio && (
                                    <button
                                      onClick={() => {
                                        const w = window as any;
                                        if (w.__rrAudio) { w.__rrAudio.pause(); w.__rrAudio = null; }
                                        const audio = new Audio(proxyAudio);
                                        audio.play().catch(() => {});
                                        audio.onended = () => { w.__rrAudio = null; };
                                        w.__rrAudio = audio;
                                      }}
                                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition bg-primary/10 hover:bg-primary/20 text-primary"
                                    >
                                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                                      Play
                                    </button>
                                  )}
                                </div>
                                <p className="text-sm">{summary}</p>
                              </div>
                            );
                          }
                          if (txt.startsWith("[File]")) return <p className="text-sm mt-0.5 text-muted-foreground">📎 {txt.replace("[File]", "").trim()}</p>;
                          if (txt.startsWith("[Image]")) return <p className="text-sm mt-0.5 text-muted-foreground">🖼️ {txt.replace("[Image]", "").trim()}</p>;
                          if (txt.startsWith("[Video]")) return <p className="text-sm mt-0.5 text-muted-foreground">🎥 {txt.replace("[Video]", "").trim()}</p>;
                          if (txt.startsWith("[Sticker]")) return <p className="text-sm mt-0.5">{txt.replace("[Sticker]", "").trim()}</p>;
                          return <p className="text-sm mt-0.5">{txt}</p>;
                        })()}
                      </div>
                    </div>
                  );
                  return acc;
                }, [])}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT: Timeline + Commitments + Health (1/3 width) */}
        <div className="space-y-6">

          {/* Health score */}
          {health && (
            <Card className="p-5">
              <SectionHeader icon={Activity} title="Health score" />
              <div className="flex items-center gap-4 mb-4">
                <div className="relative h-16 w-16 shrink-0">
                  <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={health.health.healthLabel === "HEALTHY" ? "hsl(142 76% 36%)" : health.health.healthLabel === "AT_RISK" ? "hsl(38 92% 50%)" : "hsl(var(--destructive))"}
                      strokeWidth="3"
                      strokeDasharray={`${health.health.healthScore} 100`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold leading-none">{health.health.healthScore}</span>
                  </div>
                </div>
                <div>
                  <Badge variant="outline" className={`gap-1 mb-1 ${HC[health.health.healthLabel]?.cls}`}>
                    {health.health.healthLabel.replace("_", " ")}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {health.health.healthLabel === "HEALTHY" ? "Chat is well managed" :
                     health.health.healthLabel === "AT_RISK" ? "Needs some attention" :
                     "Needs immediate attention"}
                  </p>
                </div>
              </div>
              {(health as any).components && (
                <div className="space-y-2 mb-4">
                  {[
                    { label: "Activity", score: (health as any).components.activityScore },
                    { label: "Response", score: (health as any).components.responseScore },
                    { label: "Open tasks", score: (health as any).components.tasksScore },
                  ].map(c => {
                    const color = c.score >= 80 ? "hsl(142 76% 36%)" : c.score >= 60 ? "hsl(38 92% 50%)" : "hsl(var(--destructive))";
                    return (
                      <div key={c.label} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-20 shrink-0">{c.label}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${c.score}%`, background: color }} />
                        </div>
                        <span className="text-xs font-medium w-6 text-right">{c.score}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {health.recurringIssues.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Recurring issues</p>
                  {health.recurringIssues.slice(0, 3).map(issue => (
                    <div key={issue.id} className="p-2.5 rounded-lg border border-warning/20 bg-warning/5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium">{issue.topic}</p>
                        <Badge variant="outline" className="text-warning border-warning/30 text-xs">{issue.occurrences}×</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Commitments */}
          <Card className="p-5">
            <SectionHeader
              icon={GitCommit}
              title="Commitments"
              count={openCommitments.length}
              action={
                <Link to="/app/commitments" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  All <ChevronRight className="h-3 w-3" />
                </Link>
              }
            />
            {sideLoading && commitments.length === 0 ? (
              <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
            ) : commitments.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No commitments detected yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {commitments.slice(0, 5).map(c => (
                  <div key={c.id} className={`p-3 rounded-lg border ${c.status === "OVERDUE" ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-primary">{c.person}</span>
                        <p className="text-xs mt-0.5 line-clamp-2">{c.commitment}</p>
                        {c.dueDate && (
                          <p className={`text-xs mt-0.5 ${c.status === "OVERDUE" ? "text-destructive" : "text-muted-foreground"}`}>
                            Due {new Date(c.dueDate).toLocaleDateString("en-GB")}
                          </p>
                        )}
                      </div>
                      {(c.status === "OPEN" || c.status === "OVERDUE") && (
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={() => markCommitmentDone(c.id)}>
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground hover:text-success" />
                        </Button>
                      )}
                      {c.status === "COMPLETED" && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Timeline */}
          <Card className="p-5">
            <SectionHeader icon={Calendar} title="Timeline" count={timeline.length} />
            {sideLoading && timeline.length === 0 ? (
              <div className="space-y-3"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
            ) : timeline.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">No events yet</p>
                <p className="text-xs mt-1 opacity-70">Generate a summary to extract events</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-3">
                  {timeline.slice(0, 8).map(event => {
                    const cfg = TL[event.type] ?? TL.ISSUE;
                    const Icon = cfg.icon;
                    return (
                      <div key={event.id} className="flex gap-3 pl-1">
                        <div className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 z-10 bg-background ${cfg.cls}`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <p className="text-xs font-medium leading-tight">{event.title}</p>
                              {event.people.length > 0 && (
                                <p className="text-xs text-muted-foreground mt-0.5">{event.people.join(", ")}</p>
                              )}
                            </div>
                            <Badge variant="outline" className={`text-xs shrink-0 ${cfg.cls}`}>{cfg.label}</Badge>
                          </div>
                          {event.dueDate && (
                            <p className="text-xs text-warning mt-0.5">Due {new Date(event.dueDate).toLocaleDateString("en-GB")}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {timeline.length > 8 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">+{timeline.length - 8} more events</p>
                  )}
                </div>
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
};

export default ChatDetail;
