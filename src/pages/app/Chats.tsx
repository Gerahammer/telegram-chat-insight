import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TimeAgo } from "@/components/Badges";
import { Search, Hash, Inbox, RefreshCw, CheckCircle2, Clock, MessageSquare, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { ConnectChatDialog } from "@/components/ConnectChatDialog";

interface ApiChat {
  id: string;
  title: string;
  telegramChatId?: string | number;
  chatType?: string;
  isActive?: boolean;
  lastActivityAt?: string | null;
  messageCount?: number;
  todaySummary?: string | null;
}

const SummaryStatus = ({ summary }: { summary?: unknown }) => {
  const text = typeof summary === "string" ? summary : "";
  if (text.trim().length > 0) {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2 className="h-3 w-3 text-success" /> Today's summary ready
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <Clock className="h-3 w-3" /> No summary yet
    </Badge>
  );
};

const Chats = () => {
  const [q, setQ] = useState("");
  const [chats, setChats] = useState<ApiChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  const fetchChats = useCallback(async (showToast = false) => {
    try {
      const res = await apiFetch("/api/chats");
      if (!res.ok) {
        setChats([]);
        if (showToast) toast.error("Failed to load chats");
        return;
      }
      const data = await res.json();
      const list: ApiChat[] = Array.isArray(data) ? data : (data?.items ?? data?.chats ?? []);
      setChats(list);
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => (
            <Link key={c.id} to={`/app/chats/${encodeURIComponent(c.id)}`} className="block">
              <Card className="p-5 h-full hover:border-primary/40 hover:shadow-md transition">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Hash className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold truncate">{c.title || "Untitled chat"}</h3>
                      {c.chatType && (
                        <Badge variant="secondary" className="capitalize shrink-0">{c.chatType.toLowerCase()}</Badge>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="font-medium text-foreground">{c.messageCount ?? 0}</span> messages
                      </span>
                      <span>
                        {c.lastActivityAt ? <TimeAgo iso={c.lastActivityAt} /> : "No activity"}
                      </span>
                    </div>
                    <div className="mt-4">
                      <SummaryStatus summary={c.todaySummary} />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
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
