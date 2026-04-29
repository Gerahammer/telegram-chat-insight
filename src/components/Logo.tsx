import { Radar } from "lucide-react";
import { cn } from "@/lib/utils";

export const Logo = ({ className, showText = true }: { className?: string; showText?: boolean }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <div className="relative flex h-8 w-8 items-center justify-center rounded-lg gradient-primary shadow-glow">
      <Radar className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
    </div>
    {showText && <span className="text-lg font-bold tracking-tight">ReplyRadar</span>}
  </div>
);
