import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SentimentBadge, TimeAgo } from "@/components/Badges";
import { Sparkles, ArrowRight, Inbox, Calendar } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface ApiChat {
  id: string;
  title: string;
  photoUrl?: string;
  todaySummary?: {
    id: string;
    summaryText: string;
    sentiment: string;
    requiresAttention: boolean;
    noActivity: boolean;
    generatedAt: string;
    date: string;
  } | null;
  lastSummarizedAt?: string;
}

const Summaries = () => {
  const [chats, setChats] = useState<ApiChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/chats");
        if (res.ok) {
          const data = await res.json();
          const list: ApiChat[] = Array.isArray(data) ? data : (data?.chats ?? []);
          // Only show chats that have summaries
          setChats(list);
        }
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  const withSummaries = chats.filter(c => c.todaySummary);
  const withoutSummaries = chats.filter(c => !c.todaySummary);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Daily summaries</h1>
        <p className="text-muted-foreground mt-1">
          {loading ? "Loading…" : `${withSummaries.length} of ${chats.length} chats summarized today`}
        </p>
      </div>

      {loading ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {[0,1,2].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : chats.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No chats connected yet.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Chats with summaries */}
          {withSummaries.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-4">
              {withSummaries.map(c => (
                <Card key={c.id} className="p-6 hover:shadow-md transition">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {c.photoUrl ? (
                        <img
                          src={`https://seahorse-app-47666.ondigitalocean.app/api/proxy/image?url=${encodeURIComponent(c.photoUrl)}`}
                          alt={c.title}
                          className="h-9 w-9 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                          <Sparkles className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{c.title}</div>
                        {c.todaySummary?.generatedAt && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Generated <TimeAgo iso={c.todaySummary.generatedAt} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {c.todaySummary?.sentiment && <SentimentBadge sentiment={c.todaySummary.sentiment} />}
                      {c.todaySummary?.requiresAttention && (
                        <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10 text-xs">Attention</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                    {c.todaySummary?.noActivity
                      ? "No activity recorded today."
                      : (c.todaySummary?.summaryText ?? "")}
                  </p>
                  <Button variant="ghost" size="sm" asChild className="mt-3 -ml-2">
                    <Link to={`/app/chats/${c.id}`}>Open chat <ArrowRight className="h-3 w-3 ml-1" /></Link>
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {/* Chats without summaries */}
          {withoutSummaries.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Not yet summarized today</h2>
              <div className="grid lg:grid-cols-2 gap-3">
                {withoutSummaries.map(c => (
                  <Link key={c.id} to={`/app/chats/${c.id}`}>
                    <Card className="p-4 hover:border-primary/40 transition flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {c.photoUrl ? (
                          <img
                            src={`https://seahorse-app-47666.ondigitalocean.app/api/proxy/image?url=${encodeURIComponent(c.photoUrl)}`}
                            alt={c.title}
                            className="h-8 w-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium text-sm">{c.title}</span>
                      </div>
                      <Badge variant="outline" className="text-xs text-muted-foreground">No summary yet</Badge>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Summaries;
