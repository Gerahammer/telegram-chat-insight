import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TimeAgo } from "@/components/Badges";
import { Search, Hash, Inbox, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface ChatRow {
  id: string;
  title: string;
  lastActivity: string | null;
  summaryStatus: "ready" | "pending" | "none";
  type?: string;
  members?: number;
  messagesToday?: number;
}

// Normalize whatever the backend returns into a stable row shape.
const normalize = (raw: any): ChatRow => {
  const title =
    raw?.title ?? raw?.name ?? raw?.chatTitle ?? raw?.chat_name ?? "Untitled chat";
  const lastActivity =
    raw?.lastActivity ?? raw?.last_activity ?? raw?.lastMessageAt ?? raw?.last_message_at ?? null;

  const summary = raw?.todaySummary ?? raw?.daily_summary ?? raw?.summary ?? null;
  const summaryStatusRaw =
    raw?.summaryStatus ?? raw?.summary_status ?? (summary ? "ready" : "none");
  const summaryStatus: ChatRow["summaryStatus"] =
    summaryStatusRaw === "ready" || summaryStatusRaw === "pending" || summaryStatusRaw === "none"
      ? summaryStatusRaw
      : summary
        ? "ready"
        : "none";

  return {
    id: String(raw?.id ?? raw?.chatId ?? raw?.chat_id ?? ""),
    title,
    lastActivity,
    summaryStatus,
    type: raw?.type,
    members: raw?.members ?? raw?.memberCount ?? raw?.member_count,
    messagesToday: raw?.messagesToday ?? raw?.messages_today,
  };
};

const SummaryStatusBadge = ({ status }: { status: ChatRow["summaryStatus"] }) => {
  if (status === "ready")
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3 w-3 text-success" /> Today's summary ready
      </Badge>
    );
  if (status === "pending")
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3 text-muted-foreground" /> Pending
      </Badge>
    );
  return <span className="text-muted-foreground text-xs">No summary yet</span>;
};

const Chats = () => {
  const [q, setQ] = useState("");
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChats = useCallback(async (showToast = false) => {
    try {
      const res = await apiFetch("/api/chats");
      if (!res.ok) {
        setChats([]);
        if (showToast) toast.error("Failed to load chats");
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data?.items ?? data?.chats ?? []);
      setChats(list.map(normalize));
      if (showToast) toast.success("Chats refreshed");
    } catch {
      setChats([]);
      if (showToast) toast.error("Failed to load chats");
    }
  }, []);

  useEffect(() => {
    (async () => {
      await fetchChats();
      setLoading(false);
    })();
  }, [fetchChats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChats(true);
    setRefreshing(false);
  };

  const list = chats.filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Chats</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? "Loading…" : `${chats.length} connected Telegram chats`}
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing || loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card className="p-4 border-dashed bg-secondary/30">
        <p className="text-sm text-muted-foreground">
          To connect a new chat, add <span className="font-mono font-semibold text-foreground">@Sumerz_bot</span> to your
          Telegram group and send <span className="font-mono font-semibold text-foreground">/connect [token]</span> in
          the group. Your token is shown in onboarding and Settings. Then click Refresh to see the chat appear here.
        </p>
      </Card>

      <Card className="p-4">
        <div className="relative max-w-sm">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats..." className="pl-9" />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : chats.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No chats connected yet.</p>
            <p className="text-xs mt-1">Add @Sumerz_bot to a Telegram group and run /connect [token].</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left font-medium px-4 py-3">Chat</th>
                  <th className="text-left font-medium px-4 py-3">Last activity</th>
                  <th className="text-left font-medium px-4 py-3">Today's summary</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-secondary/30 transition">
                    <td className="px-4 py-3">
                      <Link to={`/app/chats/${c.id}`} className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Hash className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{c.title}</div>
                          {c.members != null && (
                            <div className="text-xs text-muted-foreground">{c.members} members</div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {c.lastActivity ? (
                        <TimeAgo iso={c.lastActivity} />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <SummaryStatusBadge status={c.summaryStatus} />
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-muted-foreground">
                      No chats match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Chats;
