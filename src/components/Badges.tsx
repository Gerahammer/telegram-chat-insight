import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AttentionStatus, Sentiment, ActionPriority, ActionStatus } from "@/lib/mock-data";
import { AlertTriangle, CheckCircle2, Clock, Flame, MinusCircle, Smile, Frown, Meh } from "lucide-react";

export const AttentionBadge = ({ status }: { status: AttentionStatus }) => {
  const map = {
    urgent: { label: "Urgent", icon: Flame, cls: "bg-destructive/10 text-destructive border-destructive/20" },
    needs_attention: { label: "Needs attention", icon: AlertTriangle, cls: "bg-warning/10 text-warning border-warning/20" },
    no_activity: { label: "No activity", icon: MinusCircle, cls: "bg-muted text-muted-foreground border-border" },
    ok: { label: "Active", icon: CheckCircle2, cls: "bg-success/10 text-success border-success/20" },
  } as const;
  const { label, icon: Icon, cls } = map[status];
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

export const SentimentBadge = ({ sentiment }: { sentiment: Sentiment }) => {
  const map = {
    positive: { label: "Positive", icon: Smile, cls: "bg-success/10 text-success border-success/20" },
    neutral: { label: "Neutral", icon: Meh, cls: "bg-muted text-muted-foreground border-border" },
    negative: { label: "Negative", icon: Frown, cls: "bg-destructive/10 text-destructive border-destructive/20" },
  } as const;
  const { label, icon: Icon, cls } = map[sentiment];
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", cls)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

export const PriorityBadge = ({ priority }: { priority: ActionPriority }) => {
  const map = {
    high: "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    low: "bg-muted text-muted-foreground border-border",
  };
  return <Badge variant="outline" className={cn("font-medium capitalize", map[priority])}>{priority}</Badge>;
};

export const StatusBadge = ({ status }: { status: ActionStatus }) => {
  const map = {
    open: { label: "Open", cls: "bg-primary/10 text-primary border-primary/20" },
    in_progress: { label: "In progress", cls: "bg-warning/10 text-warning border-warning/20" },
    resolved: { label: "Resolved", cls: "bg-success/10 text-success border-success/20" },
  };
  return <Badge variant="outline" className={cn("font-medium", map[status].cls)}>{map[status].label}</Badge>;
};

export const TimeAgo = ({ iso }: { iso: string }) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />just now</span>;
  if (m < 60) return <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{m}m ago</span>;
  const h = Math.floor(m / 60);
  if (h < 24) return <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{h}h ago</span>;
  const d = Math.floor(h / 24);
  return <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{d}d ago</span>;
};
