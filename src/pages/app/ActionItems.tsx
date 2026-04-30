import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PriorityBadge, StatusBadge, TimeAgo } from "@/components/Badges";
import { Search, ListTodo, ExternalLink, RotateCcw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface ApiActionItem {
  id: string;
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  requestedBy?: string;
  createdAt?: string;
  summary?: {
    chat?: { id: string; title: string };
  };
}

interface ApiChat {
  id: string;
  title: string;
}

const ActionItems = () => {
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [chatFilter, setChatFilter] = useState("all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ApiActionItem[]>([]);
  const [chats, setChats] = useState<ApiChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchItems = async () => {
    const [itemsRes, chatsRes] = await Promise.all([
      apiFetch("/api/action-items").catch(() => null),
      apiFetch("/api/chats").catch(() => null),
    ]);
    if (itemsRes?.ok) {
      try {
        const data = await itemsRes.json();
        setItems(Array.isArray(data) ? data : (data?.actionItems ?? data?.items ?? []));
      } catch { setItems([]); }
    }
    if (chatsRes?.ok) {
      try {
        const data = await chatsRes.json();
        setChats(Array.isArray(data) ? data : (data?.chats ?? []));
      } catch { setChats([]); }
    }
  };

  useEffect(() => {
    (async () => { await fetchItems(); setLoading(false); })();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await apiFetch(`/api/action-items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      toast.success(`Marked as ${newStatus.toLowerCase().replace("_", " ")}`);
    } catch {
      toast.error("Failed to update action item");
    } finally {
      setUpdating(null);
    }
  };

  const list = items.filter((a) => {
    if (q && !a.title?.toLowerCase().includes(q.toLowerCase())) return false;
    if (priority !== "all" && (a.priority ?? "").toLowerCase() !== priority) return false;
    if (status !== "all" && (a.status ?? "").toLowerCase() !== status) return false;
    if (chatFilter !== "all" && a.summary?.chat?.id !== chatFilter) return false;
    return true;
  });

  const openCount = items.filter(i => (i.status ?? "").toLowerCase() === "open").length;
  const inProgressCount = items.filter(i => (i.status ?? "").toLowerCase() === "in_progress").length;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Action items</h1>
        <p className="text-muted-foreground mt-1">
          {loading ? "Loading…" : `${openCount} open · ${inProgressCount} in progress · ${items.length} total`}
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action items..." className="pl-9" />
          </div>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chatFilter} onValueChange={setChatFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Chat" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All chats</SelectItem>
              {chats.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="space-y-3">
        {loading ? (
          <><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></>
        ) : list.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <ListTodo className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{items.length === 0 ? "No action items yet. Generate a summary to create some." : "No action items match your filters."}</p>
          </Card>
        ) : (
          list.map((a) => {
            const statusLower = (a.status ?? "open").toLowerCase();
            const isResolved = statusLower === "resolved" || statusLower === "dismissed";
            const isInProgress = statusLower === "in_progress";
            const chatId = a.summary?.chat?.id;
            const chatTitle = a.summary?.chat?.title;

            return (
              <Card key={a.id} className={`p-5 hover:shadow-md transition ${isResolved ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{a.title}</h3>
                      {a.priority && <PriorityBadge priority={a.priority} />}
                      {a.status && <StatusBadge status={a.status} />}
                    </div>
                    {a.description && <p className="text-sm text-muted-foreground mt-1.5">{a.description}</p>}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      {chatId && chatTitle && (
                        <Link
                          to={`/app/chats/${chatId}`}
                          className="flex items-center gap-1 hover:text-primary transition"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {chatTitle}
                        </Link>
                      )}
                      {a.requestedBy && <span>👤 {a.requestedBy}</span>}
                      {a.createdAt && <TimeAgo iso={a.createdAt} />}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {/* Reopen button for resolved/dismissed items */}
                    {isResolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updating === a.id}
                        onClick={() => updateStatus(a.id, "OPEN")}
                        className="gap-1.5"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reopen
                      </Button>
                    )}

                    {/* Action buttons for open/in-progress items */}
                    {!isResolved && (
                      <>
                        {!isInProgress && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updating === a.id}
                            onClick={() => updateStatus(a.id, "IN_PROGRESS")}
                          >
                            In progress
                          </Button>
                        )}
                        {isInProgress && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={updating === a.id}
                            onClick={() => updateStatus(a.id, "OPEN")}
                            className="gap-1.5"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Back to open
                          </Button>
                        )}
                        <Button
                          size="sm"
                          className="gradient-primary border-0"
                          disabled={updating === a.id}
                          onClick={() => updateStatus(a.id, "RESOLVED")}
                        >
                          Resolve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActionItems;
