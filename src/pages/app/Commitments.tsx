import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeAgo } from "@/components/Badges";
import { CheckCircle2, Clock, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface Commitment {
  id: string;
  person: string;
  commitment: string;
  dueDate?: string;
  status: string;
  createdAt: string;
  chatId: string;
  chat?: { title: string };
}

interface ApiChat { id: string; title: string; commitments?: Commitment[]; }

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
  OPEN:      { label: "Open",      icon: Clock,         cls: "bg-primary/10 text-primary border-primary/20" },
  COMPLETED: { label: "Completed", icon: CheckCircle2,  cls: "bg-success/10 text-success border-success/20" },
  OVERDUE:   { label: "Overdue",   icon: AlertTriangle, cls: "bg-destructive/10 text-destructive border-destructive/20" },
  CANCELLED: { label: "Cancelled", icon: XCircle,       cls: "bg-muted text-muted-foreground border-border" },
};

const CommitmentBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status?.toUpperCase()] ?? STATUS_CONFIG.OPEN;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${cfg.cls}`}>
      <Icon className="h-3 w-3" /> {cfg.label}
    </Badge>
  );
};

const Commitments = () => {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [chats, setChats] = useState<ApiChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("open");
  const [chatFilter, setChatFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchAll = async () => {
    const chatsRes = await apiFetch("/api/chats").catch(() => null);
    if (!chatsRes?.ok) { setLoading(false); return; }

    const chatsData = await chatsRes.json();
    const chatList: ApiChat[] = Array.isArray(chatsData) ? chatsData : (chatsData?.chats ?? []);
    setChats(chatList);

    // Fetch commitments for each chat
    const allCommitments: Commitment[] = [];
    await Promise.all(chatList.map(async (chat) => {
      const res = await apiFetch(`/api/chats/${chat.id}/commitments`).catch(() => null);
      if (!res?.ok) return;
      const data = await res.json().catch(() => null);
      const list: Commitment[] = data?.commitments ?? [];
      list.forEach(c => { c.chatId = chat.id; c.chat = { title: chat.title }; });
      allCommitments.push(...list);
    }));

    // Sort: overdue first, then by due date
    allCommitments.sort((a, b) => {
      if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
      if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return 0;
    });

    setCommitments(allCommitments);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const updateStatus = async (id: string, chatId: string, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await apiFetch(`/api/chats/${chatId}/commitments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      setCommitments(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast.success("Updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = commitments.filter(c => {
    if (statusFilter !== "all" && c.status.toLowerCase() !== statusFilter) return false;
    if (chatFilter !== "all" && c.chatId !== chatFilter) return false;
    return true;
  });

  const overdueCount = commitments.filter(c => c.status === "OVERDUE").length;
  const openCount = commitments.filter(c => c.status === "OPEN").length;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Commitments</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? "Loading…" : `${openCount} open · ${overdueCount} overdue`}
          </p>
        </div>
        <Button variant="outline" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const count = commitments.filter(c => c.status === status).length;
            const Icon = cfg.icon;
            return (
              <Card
                key={status}
                className={`p-4 cursor-pointer transition hover:shadow-md ${statusFilter === status.toLowerCase() ? "border-primary" : ""}`}
                onClick={() => setStatusFilter(statusFilter === status.toLowerCase() ? "all" : status.toLowerCase())}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{cfg.label}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chatFilter} onValueChange={setChatFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All chats</SelectItem>
              {chats.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No commitments found.</p>
            <p className="text-xs mt-1">Commitments are extracted automatically from chat summaries.</p>
          </Card>
        ) : (
          filtered.map(c => (
            <Card key={c.id} className={`p-5 ${c.status === "OVERDUE" ? "border-destructive/30 bg-destructive/3" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-primary">{c.person}</span>
                    <CommitmentBadge status={c.status} />
                    {c.status === "OVERDUE" && (
                      <Badge variant="destructive" className="text-xs">Overdue</Badge>
                    )}
                  </div>
                  <p className="text-sm">{c.commitment}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {c.chat?.title && (
                      <Link to={`/app/chats/${c.chatId}`} className="hover:text-primary flex items-center gap-1">
                        💬 {c.chat.title}
                      </Link>
                    )}
                    {c.dueDate && (
                      <span className={c.status === "OVERDUE" ? "text-destructive font-medium" : ""}>
                        Due: {new Date(c.dueDate).toLocaleDateString()}
                      </span>
                    )}
                    <TimeAgo iso={c.createdAt} />
                  </div>
                </div>
                {(c.status === "OPEN" || c.status === "OVERDUE") && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updating === c.id}
                    onClick={() => updateStatus(c.id, c.chatId, "COMPLETED")}
                    className="shrink-0"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Mark done
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Commitments;
