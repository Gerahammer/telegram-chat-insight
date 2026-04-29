import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AttentionBadge } from "@/components/Badges";
import { Sparkles, ArrowRight, Inbox } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { AttentionStatus } from "@/lib/mock-data";

interface DailySummary {
  id: string;
  chatId?: string;
  chat?: string;
  chatName?: string;
  summary?: string;
  text?: string;
  messagesToday?: number;
  attention?: AttentionStatus;
}

const Summaries = () => {
  const [items, setItems] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/summaries/daily");
        if (res.ok) {
          const data = await res.json();
          const list: DailySummary[] = Array.isArray(data) ? data : data?.items ?? [];
          if (!cancelled) setItems(list);
        }
      } catch { /* empty */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Daily summaries</h1>
        <p className="text-muted-foreground mt-1">Fresh AI digests for every connected chat.</p>
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No summaries available yet.</p>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {items.map((s) => {
            const chatLabel = s.chat ?? s.chatName ?? "Chat";
            const body = s.summary ?? s.text ?? "";
            return (
              <Card key={s.id} className="p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-semibold">{chatLabel}</div>
                      {typeof s.messagesToday === "number" && (
                        <div className="text-xs text-muted-foreground">{s.messagesToday} messages today</div>
                      )}
                    </div>
                  </div>
                  {s.attention && <AttentionBadge status={s.attention} />}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{body}</p>
                {s.chatId && (
                  <Button variant="ghost" size="sm" asChild className="mt-3 -ml-2">
                    <Link to={`/app/chats/${s.chatId}`}>Open chat <ArrowRight className="h-3 w-3 ml-1" /></Link>
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Summaries;
