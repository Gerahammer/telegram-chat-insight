import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SentimentBadge, TimeAgo } from "@/components/Badges";
import { Search, MessageSquare, FileText, Calendar, Hash } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface SearchResult {
  query: string;
  totalMessages: number;
  totalSummaries: number;
  totalTimelineEvents: number;
  messagesByChat: Array<{
    chatId: string;
    chatTitle: string;
    messages: Array<{
      id: string;
      text: string;
      highlight: string;
      senderName: string;
      sentAt: string;
    }>;
  }>;
  summaries: Array<{
    id: string;
    summaryText: string;
    date: string;
    chatId: string;
    chatTitle: string;
    sentiment: string;
  }>;
  timelineEvents: Array<{
    id: string;
    type: string;
    title: string;
    occurredAt: string;
    chatId: string;
    chatTitle: string;
  }>;
}

const TIMELINE_ICONS: Record<string, string> = {
  AGREEMENT: "🤝",
  DECISION: "✅",
  DEADLINE: "⏰",
  COMMITMENT: "💬",
  MILESTONE: "🏆",
  ISSUE: "⚠️",
};

function highlight(text: string, query: string): JSX.Element {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

const SearchPage = () => {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const query = q.trim();
    if (query.length < 2) { toast.error("Enter at least 2 characters"); return; }
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const res = await apiFetch(`/api/search?${params}`);
      if (!res.ok) throw new Error("Search failed");
      setResults(await res.json());
    } catch {
      toast.error("Search failed");
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [q, from, to]);

  const total = results
    ? results.totalMessages + results.totalSummaries + results.totalTimelineEvents
    : 0;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground mt-1">Search across all messages, summaries and timeline events.</p>
      </div>

      {/* Search bar */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="Search anything..."
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>From</span>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="border rounded-md px-2 py-1.5 text-sm bg-background" />
            <span>to</span>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="border rounded-md px-2 py-1.5 text-sm bg-background" />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[0,1,2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      )}

      {/* No results */}
      {!loading && searched && results && total === 0 && (
        <Card className="p-12 text-center text-muted-foreground">
          <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No results found for <strong>"{results.query}"</strong></p>
        </Card>
      )}

      {/* Results */}
      {!loading && results && total > 0 && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Found <strong>{total}</strong> results for <strong>"{results.query}"</strong>
            {" "}— {results.totalMessages} messages, {results.totalSummaries} summaries, {results.totalTimelineEvents} timeline events
          </p>

          {/* Messages by chat */}
          {results.messagesByChat.map(group => (
            <Card key={group.chatId} className="p-5">
              <Link to={`/app/chats/${group.chatId}`} className="flex items-center gap-2 mb-4 hover:text-primary transition">
                <Hash className="h-4 w-4" />
                <h3 className="font-semibold">{group.chatTitle}</h3>
                <Badge variant="secondary" className="text-xs">{group.messages.length} messages</Badge>
              </Link>
              <div className="space-y-3">
                {group.messages.map(m => (
                  <div key={m.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">{m.senderName}</span>
                      <TimeAgo iso={m.sentAt} />
                    </div>
                    <p className="text-sm">{highlight(m.highlight, results.query)}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {/* Summaries */}
          {results.summaries.length > 0 && (
            <div>
              <h2 className="font-semibold flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4" /> Summaries
              </h2>
              <div className="space-y-3">
                {results.summaries.map(s => (
                  <Link key={s.id} to={`/app/chats/${s.chatId}`}>
                    <Card className="p-4 hover:border-primary/40 transition">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{s.chatTitle}</span>
                        <div className="flex items-center gap-2">
                          <SentimentBadge sentiment={s.sentiment} />
                          <span className="text-xs text-muted-foreground">
                            {new Date(s.date).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {highlight(s.summaryText, results.query)}
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Timeline events */}
          {results.timelineEvents.length > 0 && (
            <div>
              <h2 className="font-semibold flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4" /> Timeline events
              </h2>
              <div className="space-y-2">
                {results.timelineEvents.map(e => (
                  <Link key={e.id} to={`/app/chats/${e.chatId}`}>
                    <Card className="p-4 hover:border-primary/40 transition">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{TIMELINE_ICONS[e.type] ?? "📌"}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{e.title}</span>
                            <Badge variant="outline" className="text-xs capitalize">{e.type.toLowerCase()}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {e.chatTitle} · <TimeAgo iso={e.occurredAt} />
                          </div>
                        </div>
                      </div>
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

export default SearchPage;
