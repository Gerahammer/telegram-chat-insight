import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, AlertTriangle, HelpCircle, GitCommit, ListTodo, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";

interface Notification {
  id: string;
  type: "attention" | "unanswered" | "overdue" | "action";
  title: string;
  subtitle: string;
  chatId?: string;
  link: string;
}

const TYPE_CONFIG = {
  attention:  { icon: AlertTriangle, cls: "text-warning",     label: "Needs attention" },
  unanswered: { icon: HelpCircle,    cls: "text-warning",     label: "Unanswered question" },
  overdue:    { icon: GitCommit,     cls: "text-destructive", label: "Overdue commitment" },
  action:     { icon: ListTodo,      cls: "text-primary",     label: "Open action item" },
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [chatsRes, actionsRes] = await Promise.all([
        apiFetch("/api/chats").catch(() => null),
        apiFetch("/api/action-items?status=OPEN").catch(() => null),
      ]);

      const notes: Notification[] = [];

      if (chatsRes?.ok) {
        const data = await chatsRes.json();
        const chats = Array.isArray(data) ? data : (data?.chats ?? []);

        chats.forEach((c: any) => {
          // Chats needing attention
          if (c.todaySummary?.requiresAttention) {
            notes.push({
              id: `attention-${c.id}`,
              type: "attention",
              title: c.title,
              subtitle: "Needs your attention",
              chatId: c.id,
              link: `/app/chats/${c.id}`,
            });
          }
          // Unanswered questions
          if (c.todaySummary?.unansweredQuestions?.length > 0) {
            notes.push({
              id: `unanswered-${c.id}`,
              type: "unanswered",
              title: c.title,
              subtitle: `${c.todaySummary.unansweredQuestions.length} unanswered question${c.todaySummary.unansweredQuestions.length > 1 ? "s" : ""}`,
              chatId: c.id,
              link: `/app/chats/${c.id}`,
            });
          }
        });
      }

      // Overdue commitments
      const chatsRes2 = await apiFetch("/api/chats").catch(() => null);
      if (chatsRes2?.ok) {
        const data = await chatsRes2.json();
        const chats = Array.isArray(data) ? data : (data?.chats ?? []);
        await Promise.all(chats.map(async (c: any) => {
          const cmRes = await apiFetch(`/api/chats/${c.id}/commitments?status=OVERDUE`).catch(() => null);
          if (cmRes?.ok) {
            const cmData = await cmRes.json();
            const overdue = cmData?.commitments ?? [];
            if (overdue.length > 0) {
              notes.push({
                id: `overdue-${c.id}`,
                type: "overdue",
                title: c.title,
                subtitle: `${overdue.length} overdue commitment${overdue.length > 1 ? "s" : ""}`,
                chatId: c.id,
                link: `/app/commitments`,
              });
            }
          }
        }));
      }

      // Open action items
      if (actionsRes?.ok) {
        const data = await actionsRes.json();
        const actions = Array.isArray(data) ? data : (data?.actionItems ?? data?.items ?? []);
        if (actions.length > 0) {
          notes.push({
            id: "open-actions",
            type: "action",
            title: `${actions.length} open action item${actions.length > 1 ? "s" : ""}`,
            subtitle: "Tap to view",
            link: "/app/action-items",
          });
        }
      }

      setNotifications(notes);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const visible = notifications.filter(n => !dismissed.has(n.id));
  const count = visible.length;

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(o => !o)}>
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center font-medium">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button onClick={() => setDismissed(new Set(notifications.map(n => n.id)))}
                  className="text-xs text-muted-foreground hover:text-foreground transition">
                  Clear all
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground text-center">Loading...</div>
            ) : visible.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">All clear!</p>
              </div>
            ) : (
              visible.map(n => {
                const cfg = TYPE_CONFIG[n.type];
                const Icon = cfg.icon;
                return (
                  <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition border-b last:border-0">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.cls}`} />
                    <Link to={n.link} className="flex-1 min-w-0" onClick={() => { setOpen(false); setDismissed(d => new Set([...d, n.id])); }}>
                      <p className="text-sm font-medium leading-tight">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.subtitle}</p>
                      <Badge variant="outline" className={`text-xs mt-1 ${cfg.cls}`}>{cfg.label}</Badge>
                    </Link>
                    <button onClick={() => setDismissed(d => new Set([...d, n.id]))}
                      className="text-muted-foreground hover:text-foreground transition shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
