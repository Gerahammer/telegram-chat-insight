import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TimeAgo, SentimentBadge } from "@/components/Badges";
import {
  Search, Hash, Inbox, RefreshCw, CheckCircle2, Clock,
  MessageSquare, Plus, LayoutGrid, List, AlertTriangle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
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
  telegramChatId?: string | number;
  chatType?: string;
  isActive?: boolean;
  lastActivityAt?: string | null;
  lastSummarizedAt?: string | null;
  messageCount?: number;
  todaySummary?: TodaySummary | string | null;
}

// Correctly handle todaySummary as either object or string
function getSummaryStatus(todaySummary: ApiChat["todaySummary"]): {
  hasSum: boolean;
  requiresAttention: boolean;
  sentiment?: string;
  noActivity: boolean;
  text?: string;
} {
  if (!todaySummary) return { hasSum: false, requiresAttention: false, noActivity: false };

  if (typeof todaySummary === "string") {
    return { hasSum: todaySummary.length > 0, requiresAttention: false, noActivity: false, text: todaySummary };
  }

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
  if (!s.hasSum) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <Clock className="h-3 w-3" /> No summary yet
      </Badge>
    );
  }
  if (s.noActivity) {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <Clock className="h-3 w-3" /> No activity
      </Badge>
    );
  }
  if (s.requiresAttention) {
    return (
      <Badge variant="outline" className="gap-1 text-warning border-warning/30 bg-warning/10">
        <AlertTriangle className="h-3 w-3" /> Needs attention
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <CheckCircle2 className="h-3 w-3 text-success" /> Summary ready
    </Badge>
  );
};

// ─── Card view ────────────────────────────────────────────────────────────────

const ChatCard = ({ c }: { c: ApiChat }) => {
  const s = getSummaryStatus(c.todaySummary);
  return (
    <Link to={`/app/chats/${encodeURIComponent(c.id)}`} className="block">
      <Card className="p-5 h-full hover:border-primary/40 hover:shadow-md transition">
        <div className="flex items-start gap-3">
          {c.photoUrl ? <img src={`https://seahorse-app-47666.ondigitalocean.app/api/proxy/image?url=${encodeURIComponent(c.photoUrl)}`} alt={c.title} className="h-10 w-10 rounded-lg object-cover shrink-0" /> : <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Hash className="h-5 w-5" />
          </div>}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold truncate">{c.title || "Untitled chat"}</h3>
              <div className="flex items-center gap-1 shrink-0">
                {c.chatType && <Badge variant="secondary" className="capitalize text-xs">{c.chatType.toLowerCase()}</Badge>}
                {c.isActive === false && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span className="font-medium text-foreground">{c.messageCount ?? 0}</span> messages
              </span>
              {c.lastActivityAt && (
                <span>Last active: <TimeAgo iso={c.lastActivityAt} /></span>
              )}
              {c.lastSummarizedAt && (
                <span>Summarized: <TimeAgo iso={c.lastSummarizedAt} /></span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SummaryBadge todaySummary={c.todaySummary} />
              {s.hasSum && s.sentiment && (
                <SentimentBadge sentiment={s.sentiment as any} />
              )}
            </div>

            {s.hasSum && s.text && !s.noActivity && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{s.text}</p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

// ─── List row view ────────────────────────────────────────────────────────────

const ChatRow = ({ c }: { c: ApiChat }) => {
  const s = getSummaryStatus(c.todaySummary);
  return (
    <Link to={`/app/chats/${encodeURIComponent(c.id)}`} className="block">
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-secondary/30 transition">
        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Hash className="h-4 w-4" />
        </div>

        {/* Title */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{c.title || "Untitled chat"}</span>
            {c.chatType && <Badge variant="secondary" className="capitalize text-xs shrink-0">{c.chatType.toLowerCase()}</Badge>}
            {c.isActive === false && <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">Inactive</Badge>}
          </div>
          {s.hasSum && s.text && !s.noActivity && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{s.text}</p>
          )}
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground shrink-0">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {c.messageCount ?? 0}
          </span>
          {c.lastActivityAt && <TimeAgo iso={c.lastActivityAt} />}
          {c.lastSummarizedAt && (
            <span className="text-xs">
              Summarized: <TimeAgo iso={c.lastSummarizedAt} />
            </span>
          )}
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2 shrink-0">
          <SummaryBadge todaySummary={c.todaySummary} />
          {s.hasSum && s.sentiment && <SentimentBadge sentiment={s.sentiment as any} />}
        </div>
      </div>
    </Link>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const Chats = () => {
  const [q, setQ] = useState("");
  const [chats, setChats] = useState<ApiChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">((localStorage.getItem("chatView") as "grid" | "list") ?? "list");

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChats(true);
    setRefreshing(false);
  };

  const list = chats.filter((c) => !q || (c.title ?? "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Chats</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? "Loading…" : `${chats.length} connected Telegram chat${chats.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => { setView("list"); localStorage.setItem("chatView", "list"); }}
              className={`px-3 py-2 transition ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setView("grid"); localStorage.setItem("chatView", "grid"); }}
              className={`px-3 py-2 transition ${view === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing || loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button onClick={() => setConnectOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add chat
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats..." className="pl-9" />
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : chats.length === 0 ? (
        <Card className="py-16 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No chats connected yet.</p>
          <p className="text-xs mt-1 mb-4">Add @Sumerz_bot to a Telegram group to get started.</p>
          <Button onClick={() => setConnectOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Connect new chat
          </Button>
        </Card>
      ) : list.length === 0 ? (
        <Card className="py-12 text-center text-muted-foreground text-sm">No chats match your search.</Card>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => <ChatCard key={c.id} c={c} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((c) => <ChatRow key={c.id} c={c} />)}
        </div>
      )}

      <ConnectChatDialog
        open={connectOpen}
        onOpenChange={setConnectOpen}
        onDone={() => fetchChats(true)}
      />
    </div>
  );
};

export default Chats;
