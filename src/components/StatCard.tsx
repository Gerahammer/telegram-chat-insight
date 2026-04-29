import { Card } from "@/components/ui/card";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";

export const StatCard = ({
  label,
  value,
  icon: Icon,
  trend,
  hint,
  variant = "default",
  children,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; positive?: boolean };
  hint?: string;
  variant?: "default" | "warning" | "destructive" | "success";
  children?: ReactNode;
}) => {
  const variantCls = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  }[variant];

  return (
    <Card className="p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", variantCls)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {trend && (
          <div className={cn("text-xs font-medium flex items-center gap-0.5", trend.positive ? "text-success" : "text-destructive")}>
            {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}%
          </div>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      {children}
    </Card>
  );
};
