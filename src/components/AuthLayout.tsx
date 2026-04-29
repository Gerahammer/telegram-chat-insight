import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { ReactNode } from "react";

export default function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col p-8 lg:p-12">
        <Link to="/"><Logo /></Link>
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-6 text-sm text-center text-muted-foreground">{footer}</div>}
          </div>
        </div>
      </div>
      <div className="hidden lg:flex gradient-hero text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary-glow))_0%,transparent_50%)]" />
        <div className="relative" />
        <div className="relative space-y-6 max-w-md">
          <div className="text-3xl font-bold leading-tight">"ReplyRadar saved us from missing a $40k payout request that got buried in a busy partner chat."</div>
          <div>
            <div className="font-semibold">Sarah Whitman</div>
            <div className="text-white/60 text-sm">Head of Partnerships, Acme Affiliates</div>
          </div>
        </div>
        <div className="relative text-sm text-white/60">© 2026 ReplyRadar</div>
      </div>
    </div>
  );
}
