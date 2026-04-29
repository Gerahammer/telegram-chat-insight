import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AttentionBadge } from "@/components/Badges";
import { Sparkles, ArrowRight } from "lucide-react";
import { chats, chatSummary, recentSummaries } from "@/lib/mock-data";

const Summaries = () => {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Daily summaries</h1>
        <p className="text-muted-foreground mt-1">Fresh AI digests for every connected chat.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {chats.filter((c) => c.attention !== "no_activity").map((c) => (
          <Card key={c.id} className="p-6 hover:shadow-md transition">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center"><Sparkles className="h-4 w-4 text-primary-foreground" /></div>
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.messagesToday} messages today</div>
                </div>
              </div>
              <AttentionBadge status={c.attention} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{chatSummary(c.id)}</p>
            <Button variant="ghost" size="sm" asChild className="mt-3 -ml-2"><Link to={`/app/chats/${c.id}`}>Open chat <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Summaries;
