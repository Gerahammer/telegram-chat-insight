import { Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TimeAgo, SentimentBadge } from "@/components/Badges";
import {
  Search, Inbox, RefreshCw, CheckCircle2, Clock,
  MessageSquare, Plus, LayoutGrid, List, AlertTriangle,
  Tag, X, ChevronDown,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ChatPhoto } from "@/components/ChatPhoto";
import { toast } from "sonner";
import { ConnectChatDialog } from "@/components/ConnectChatDialog";

interface TodaySummary {
  summaryText?: string;
  requiresAttention?: boolean;
  sentiment?: string;
  noActivity?: boolean;
  generatedAt?: string;
}

interface ApiChat {
  id: string;
  title: string;
  photoUrl?: string | null;
  telegramChatId?: string | number;
  chatType?: string;
  isActive?: boolean;
  lastActivityAt?: string | null;
  lastSummarizedAt?: string | null;
  messageCount?: number;
  healthLabel?: string | null;
  tags?: string[];
  todaySummary?: TodaySummary | string | null;
}

function getSummaryStatus(todaySummary: ApiChat["todaySummary"]) {
  if (!todaySummary) return { hasSum: false, requiresAttention: false, noActivity: false } as const;
  if (typeof todaySummary === "string") return { hasSum: todaySummary.length > 0, requiresAttention: false, noActivity: false, text: todaySummary, sentiment: undefined };
  return {
    hasSum: true,
    requiresAttention: todaySummary.requiresAttention ?? false,
    sentiment: todaySummary.sentiment,
    noActivity: todaySummary.noActivity ?? false,
    text: todaySummary.summaryText,
  };
}

const SummaryBadge = ({ todaySummary }: { todaySummary: ApiChat["todaySummary"] }) => {
  const s = getSummaryStatus(todaySummary);
  if (!s.hasSum) return <Badge variant="outline" className="gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> No summary yet</Badge>;
  if (s.noActivity) return <Badge variant="outline" className="gap-1 text-muted-foreground"><Clock className="h-3 w-3" /> No activity</Badge>;
  if (s.requiresAttention) return <Badge variant="outline" className="gap-1 text-warning border-warning/30 bg-warning/10"><AlertTriangle className="h-3 w-3" /> Needs attention</Badge>;
  return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> Summary ready</Badge>;
};

// Stable tag colours derived from the tag string so the same tag always gets the same colour
const TAG_PALETTES = [
  "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "bg-violet-500/10 text-violet-600 border-violet-500/20",
  "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "bg-orange-500/10 text-orange-600 border-orange-500/20",
  "bg-pink-500/10 text-pink-600 border-pink-500/20",
  "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  "bg-rose-500/10 text-rose-600 border-rose-500/20",
];
function tagColor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTES[h % TAG_PALETTES.length];
}

// ─── Inline tag editor ────────────────────────────────────────────────────────

function TagEditor({
  chatId, tags, allTags, onUpdate,
}: { chatId: string; tags: string[]; allTags: string[]; onUpdate: (chatId: string, tags: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = allTags.filter(t => !tags.includes(t) && t.includes(input.toLowerCase()));

  const commit = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || tags.includes(t)) return;
    onUpdate(chatId, [...tags, t]);
    setInput("");
  };

  const stopClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <div onClick={stopClick} className="flex flex-wrap items-center gap-1 mt-2">
      {tags.map(t => (
        <span key={t} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border ${tagColor(t)}`}>
          {t}
          <button onClick={(e) => { stopClick(e); onUpdate(chatId, tags.filter(x => x !== t)); }}
            className="ml-0.5 opacity-60 hover:opacity-100 transition rounded-full hover:bg-black/10">
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      {adding ? (
        <div className="relative">
          <input
            ref={inputRef}
            value={input}
            autoFocus
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              e.stopPropagation();
              if (e.key === "Enter") { e.preventDefault(); commit(input); }
              if (e.key === "Escape") { setAdding(false); setInput(""); }
            }}
            onBlur={() => setTimeout(() => { setAdding(false); setInput(""); }, 150)}
            placeholder="tag name…"
            className="text-xs px-2 py-0.5 rounded-full border border-primary/40 bg-background focus:outline-none focus:border-primary w-24 transition"
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 z-20 bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[120px]">
              {suggestions.slice(0, 6).map(s => (
                <button key={s} onMouseDown={e => { stopClick(e); commit(s); setAdding(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button onClick={(e) => { stopClick(e); setAdding(true); }}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs text-muted-foreground border border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary transition">
          <Plus className="h-2.5 w-2.5" /> tag
        </button>
      )}
    </div>
  );
}

// ─── Card view ────────────────────────────────────────────────────────────────

const ChatCard = ({ c, allTags, onTagUpdate }: { c: ApiChat; allTags: string[]; onTagUpdate: (id: string, tags: string[]) => void }) => {
  const s = getSummaryStatus(c.todaySummary);
  return (
    <Link to={`/app/chats/${encodeURIComponent(c.id)}`} className="block">
      <Card className="p-5 h-full hover:border-primary/40 hover:shadow-md transition">
        <div className="flex items-start gap-3">
          <ChatPhoto photoUrl={c.photoUrl} title={c.title} size="md" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold truncate">{c.title || "Untitled chat"}</h3>
              <div className="flex items-center gap-1 shrink-0">
                {c.chatType && <Badge variant="secondary" className="capitalize text-xs">{c.chatType.toLowerCase()}</Badge>}
                {c.isActive === false && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /><span className="font-medium text-foreground">{c.messageCount ?? 0}</span> messages</span>
              {c.lastActivityAt && <span>Last active: <TimeAgo iso={c.lastActivityAt} /></span>}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SummaryBadge todaySummary={c.todaySummary} />
              {s.hasSum && s.sentiment && <SentimentBadge sentiment={s.sentiment as any} />}
            </div>

            {s.hasSum && s.text && !s.noActivity && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{s.text}</p>
            )}

            <TagEditor chatId={c.id} tags={c.tags ?? []} allTags={allTags} onUpdate={onTagUpdate} />
          </div>
        </div>
      </Card>
    </Link>
  );
};

// ─── List row view ────────────────────────────────────────────────────────────

const ChatRow = ({ c, allTags, onTagUpdate }: { c: ApiChat; allTags: string[]; onTagUpdate: (id: string, tags: string[]) => void }) => {
  const s = getSummaryStatus(c.todaySummary);
  return (
    <Link to={`/app/chats/${encodeURIComponent(c.id)}`} className="block">
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-secondary/30 transition">
        <ChatPhoto photoUrl={c.photoUrl} title={c.title} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate">{c.title || "Untitled chat"}</span>
            {c.chatType && <Badge variant="secondary" className="capitalize text-xs shrink-0">{c.chatType.toLowerCase()}</Badge>}
            {c.isActive === false && <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">Inactive</Badge>}
          </div>
          {s.hasSum && s.text && !s.noActivity && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{s.text}</p>
          )}
          <TagEditor chatId={c.id} tags={c.tags ?? []} allTags={allTags} onUpdate={onTagUpdate} />
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground shrink-0">
          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{c.messageCount ?? 0}</span>
          {c.lastActivityAt && <TimeAgo iso={c.lastActivityAt} />}
          {c.lastSummarizedAt && <span>Summarized: <TimeAgo iso={c.lastSummarizedAt} /></span>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SummaryBadge todaySummary={c.todaySummary} />
          {s.hasSum && s.sentiment && <SentimentBadge sentiment={s.sentiment as any} />}
        </div>
      </div>
    </Link>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

type StatusFilter = "all" | "attention" | "quiet" | "active";
type SentimentFilter = "all" | "POSITIVE" | "NEUTRAL" | "NEGATIVE";

const Chats = () => {
  const [q, setQ] = useState("");
  const [chats, setChats] = useState<ApiChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">((localStorage.getItem("chatView") as "grid" | "list") ?? "list");

  // Filters
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [filterSentiment, setFilterSentiment] = useState<SentimentFilter>("all");
  const [showAllTags, setShowAllTags] = useState(false);

  const fetchChats = useCallback(async (showToast = false) => {
    try {
      const res = await apiFetch("/api/chats");
      if (!res.ok) { setChats([]); if (showToast) toast.error("Failed to load chats"); return; }
      const data = await res.json();
      const list: ApiChat[] = Array.isArray(data) ? data : (data?.chats ?? data?.items ?? []);
      setChats(list);
      if (showToast) toast.success("Chats refreshed");
    } catch {
      setChats([]);
      if (showToast) toast.error("Failed to load chats");
    }
  }, []);

  useEffect(() => {
    (async () => { await fetchChats(); setLoading(false); })();
  }, [fetchChats]);

  // Collect all tags in use across all chats
  const allTags = [...new Set(chats.flatMap(c => c.tags ?? []))].sort();
  const visibleTagFilters = showAllTags ? allTags : allTags.slice(0, 8);

  // Optimistic tag update
  const handleTagUpdate = async (chatId: string, tags: string[]) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, tags } : c));
    try {
      const res = await apiFetch(`/api/chats/${encodeURIComponent(chatId)}/tags`, {
        method: "PATCH",
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) {
        const prev = chats.find(c => c.id === chatId)?.tags ?? [];
        setChats(cs => cs.map(c => c.id === chatId ? { ...c, tags: prev } : c));
        toast.error("Failed to save tags");
      }
    } catch {
      toast.error("Failed to save tags");
    }
  };

  // Apply all filters
  const filtered = chats.filter(c => {
    if (q && !(c.title ?? "").toLowerCase().includes(q.toLowerCase())) return false;
    if (filterTags.length && !filterTags.every(t => (c.tags ?? []).includes(t))) return false;
    if (filterStatus !== "all") {
      const s = getSummaryStatus(c.todaySummary);
      if (filterStatus === "attention" && !s.requiresAttention) return false;
      if (filterStatus === "quiet" && !s.noActivity) return false;
      if (filterStatus === "active" && (!s.hasSum || s.noActivity)) return false;
    }
    if (filterSentiment !== "all") {
      const s = getSummaryStatus(c.todaySummary);
      if (s.sentiment !== filterSentiment) return false;
    }
    return true;
  });

  const activeFilterCount = filterTags.length + (filterStatus !== "all" ? 1 : 0) + (filterSentiment !== "all" ? 1 : 0);

  const clearFilters = () => { setFilterTags([]); setFilterStatus("all"); setFilterSentiment("all"); setQ(""); };

  const toggleTagFilter = (tag: string) =>
    setFilterTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Chats</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? "Loading…" : `${chats.length} connected chat${chats.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button onClick={() => { setView("list"); localStorage.setItem("chatView", "list"); }}
              className={`px-3 py-2 transition ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} title="List">
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => { setView("grid"); localStorage.setItem("chatView", "grid"); }}
              className={`px-3 py-2 transition ${view === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} title="Grid">
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button variant="outline" onClick={async () => { setRefreshing(true); await fetchChats(true); setRefreshing(false); }} disabled={refreshing || loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={() => setConnectOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add chat
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <Card className="p-4 space-y-3">
        {/* Row 1: search + active filter count */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search chats…" className="pl-9" />
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition">
              <X className="h-3.5 w-3.5" /> Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
            </button>
          )}
        </div>

        {/* Row 2: Status filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Status:</span>
          {(["all", "attention", "active", "quiet"] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${filterStatus === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
              {s === "all" ? "All" : s === "attention" ? "⚡ Needs attention" : s === "active" ? "✓ Active" : "🌙 Quiet"}
            </button>
          ))}

          <span className="text-xs text-muted-foreground ml-3 shrink-0">Sentiment:</span>
          {(["all", "POSITIVE", "NEUTRAL", "NEGATIVE"] as SentimentFilter[]).map(s => (
            <button key={s} onClick={() => setFilterSentiment(s)}
              className={`text-xs px-2.5 py-1 rounded-full border transition ${filterSentiment === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
              {s === "all" ? "All" : s === "POSITIVE" ? "😊 Positive" : s === "NEUTRAL" ? "😐 Neutral" : "😟 Negative"}
            </button>
          ))}
        </div>

        {/* Row 3: Tag filters (only shown when tags exist) */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1"><Tag className="h-3 w-3" /> Tags:</span>
            {visibleTagFilters.map(tag => (
              <button key={tag} onClick={() => toggleTagFilter(tag)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${filterTags.includes(tag) ? `${tagColor(tag)} font-medium` : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                {tag}
              </button>
            ))}
            {allTags.length > 8 && (
              <button onClick={() => setShowAllTags(v => !v)}
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5 transition">
                {showAllTags ? "less" : `+${allTags.length - 8} more`}
                <ChevronDown className={`h-3 w-3 transition-transform ${showAllTags ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        )}
      </Card>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : chats.length === 0 ? (
        <Card className="py-16 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No chats connected yet.</p>
          <p className="text-xs mt-1 mb-4">Add @Sumerz_bot to a Telegram group to get started.</p>
          <Button onClick={() => setConnectOpen(true)}><Plus className="h-4 w-4 mr-2" /> Connect new chat</Button>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="py-12 text-center text-muted-foreground text-sm">
          <p>No chats match the current filters.</p>
          <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:underline">Clear filters</button>
        </Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(c => <ChatCard key={c.id} c={c} allTags={allTags} onTagUpdate={handleTagUpdate} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => <ChatRow key={c.id} c={c} allTags={allTags} onTagUpdate={handleTagUpdate} />)}
        </div>
      )}

      <ConnectChatDialog open={connectOpen} onOpenChange={setConnectOpen} onDone={() => fetchChats(true)} />
    </div>
  );
};

export default Chats;
