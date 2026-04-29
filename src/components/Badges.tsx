import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AttentionStatus, Sentiment, ActionPriority, ActionStatus } from "@/lib/mock-data";
import { AlertTriangle, CheckCircle2, Clock, Flame, MinusCircle, Smile, Frown, Meh } from "lucide-react";

// Normalize any value to lowercase for safe map lookup
function norm(v: string): string {
  return (v ?? "").toLowerCase();
}

export const AttentionBadge = ({ status }: { status: AttentionStatus | string }) => {
  const map: Record<string, { label: string; icon: typeof Flame; cls: string }> = {
    urgent:           { label: "Urgent",          icon: Flame,        cls: "bg-destructive/10 text-destructive border-destructive/20" },
    needs_attention:  { label: "Needs attention", icon: AlertTriangle, cls: "bg-warning/10 text-warning border-warning/20" },
    no_activity:      { label: "No activity",     icon: MinusCircle,  cls: "bg-muted text-muted-foreground border-border" },
    ok:               { label: "Active",          icon: CheckCircle2, cls: "bg-success/10 text-success border-success/20" },
    active:           { label: "Active",          icon: CheckCircle2, cls: "bg-success/10 text-success border-success/20" },
  };
  const key = norm(status);
  const item = map[key] ?? { label: String(status), icon: MinusCircle, cls: "bg-muted text-muted-foreground border-border" };
  const Icon = item.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", item.cls)}>
      <Icon className="h-3 w-3" />
      {item.label}
    </Badge>
  );
};

export const SentimentBadge = ({ sentiment }: { sentiment: Sentiment | string }) => {
  const map: Record<string, { label: string; icon: typeof Smile; cls: string }> = {
    positive: { label: "Positive", icon: Smile, cls: "bg-success/10 text-success border-success/20" },
    neutral:  { label: "Neutral",  icon: Meh,   cls: "bg-muted text-muted-foreground border-border" },
    negative: { label: "Negative", icon: Frown,  cls: "bg-destructive/10 text-destructive border-destructive/20" },
  };
  const key = norm(sentiment);
  const item = map[key] ?? map.neutral;
  const Icon = item.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", item.cls)}>
      <Icon className="h-3 w-3" />
      {item.label}
    </Badge>
  );
};

export const PriorityBadge = ({ priority }: { priority: ActionPriority | string }) => {
  const map: Record<string, string> = {
    high:   "bg-destructive/10 text-destructive border-destructive/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    low:    "bg-muted text-muted-foreground border-border",
  };
  const key = norm(priority);
  const cls = map[key] ?? map.low;
  return (
    <Badge variant="outline" className={cn("font-medium capitalize", cls)}>
      {key || priority}
    </Badge>
  );
};

export const StatusBadge = ({ status }: { status: ActionStatus | string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    open:        { label: "Open",        cls: "bg-primary/10 text-primary border-primary/20" },
    in_progress: { label: "In progress", cls: "bg-warning/10 text-warning border-warning/20" },
    resolved:    { label: "Resolved",    cls: "bg-success/10 text-success border-success/20" },
    dismissed:   { label: "Dismissed",   cls: "bg-muted text-muted-foreground border-border" },
  };
  const key = norm(status);
  const item = map[key] ?? { label: String(status), cls: "bg-muted text-muted-foreground border-border" };
  return (
    <Badge variant="outline" className={cn("font-medium", item.cls)}>
      {item.label}
    </Badge>
  );
};

export const TimeAgo = ({ iso }: { iso: string }) => {
  if (!iso) return null;
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (isNaN(diff)) return null;
    const m = Math.floor(diff / 60000);
    if (m < 1)  return <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />just now</span>;
    if (m < 60) return <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{m}m ago</span>;
    const h = Math.floor(m / 60);
    if (h < 24) return <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{h}h ago</span>;
    const d = Math.floor(h / 24);
    return <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{d}d ago</span>;
  } catch {
    return null;
  }
};
