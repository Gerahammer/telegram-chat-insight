import { Link } from "react-router-dom";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AttentionBadge, SentimentBadge, TimeAgo } from "@/components/Badges";
import { Search, Plus, Hash } from "lucide-react";
import { chats, type Chat } from "@/lib/mock-data";

type Filter = "all" | "needs_attention" | "no_activity" | "active" | "positive" | "neutral" | "negative";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All chats" },
  { id: "needs_attention", label: "Needs attention" },
  { id: "no_activity", label: "No activity" },
  { id: "active", label: "Active today" },
  { id: "positive", label: "Positive" },
  { id: "neutral", label: "Neutral" },
  { id: "negative", label: "Negative" },
];

const matches = (c: Chat, f: Filter, q: string) => {
  if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
  if (f === "all") return true;
  if (f === "needs_attention") return c.attention === "needs_attention" || c.attention === "urgent";
  if (f === "no_activity") return c.attention === "no_activity";
  if (f === "active") return c.messagesToday > 0;
  return c.sentiment === f;
};

const Chats = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const list = chats.filter((c) => matches(c, filter, q));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Chats</h1>
          <p className="text-muted-foreground mt-1">{chats.length} connected Telegram chats</p>
        </div>
        <Button className="gradient-primary border-0"><Plus className="h-4 w-4 mr-2" /> Connect chat</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats..." className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <Button key={f.id} size="sm" variant={filter === f.id ? "default" : "outline"} onClick={() => setFilter(f.id)} className={filter === f.id ? "gradient-primary border-0" : ""}>
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-medium px-4 py-3">Chat</th>
                <th className="text-left font-medium px-4 py-3">Type</th>
                <th className="text-left font-medium px-4 py-3">Today</th>
                <th className="text-left font-medium px-4 py-3">Last activity</th>
                <th className="text-left font-medium px-4 py-3">Sentiment</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-t border-border hover:bg-secondary/30 transition">
                  <td className="px-4 py-3">
                    <Link to={`/app/chats/${c.id}`} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Hash className="h-4 w-4" /></div>
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.members} members{c.unanswered > 0 ? ` · ${c.unanswered} unanswered` : ""}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="capitalize">{c.type}</Badge></td>
                  <td className="px-4 py-3 font-medium">{c.messagesToday}</td>
                  <td className="px-4 py-3"><TimeAgo iso={c.lastActivity} /></td>
                  <td className="px-4 py-3"><SentimentBadge sentiment={c.sentiment} /></td>
                  <td className="px-4 py-3"><AttentionBadge status={c.attention} /></td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No chats match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Chats;
