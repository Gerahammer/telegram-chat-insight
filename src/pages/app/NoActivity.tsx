import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeAgo } from "@/components/Badges";
import { Hash, MoonStar, Bell } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Chat } from "@/lib/mock-data";

const NoActivity = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/api/chats");
        if (res.ok) {
          const data = await res.json();
          const list: Chat[] = Array.isArray(data) ? data : data?.items ?? [];
          if (!cancelled) setChats(list);
        }
      } catch { /* empty */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const quiet = chats.filter((c) => c.attention === "no_activity");

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">No activity</h1>
        <p className="text-muted-foreground mt-1">Chats that have been quiet in the last 24 hours.</p>
      </div>

      <Card className="p-6 bg-gradient-to-br from-warning/5 to-transparent border-warning/20">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-warning/10 text-warning flex items-center justify-center shrink-0"><Bell className="h-4 w-4" /></div>
          <div>
            <h2 className="font-semibold">{loading ? "Checking your chats…" : `${quiet.length} chats are quiet today`}</h2>
            <p className="text-sm text-muted-foreground mt-1">Sometimes silence is fine — but it can also mean disengagement. Check in if needed.</p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </>
        ) : quiet.length === 0 ? (
          <Card className="md:col-span-2 p-12 text-center text-muted-foreground">All your chats are active today 🎉</Card>
        ) : (
          quiet.map((c) => (
            <Card key={c.id} className="p-5 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground"><Hash className="h-4 w-4" /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{c.name}</div>
                    <MoonStar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {c.members ?? 0} members{c.lastActivity ? <> · last activity <TimeAgo iso={c.lastActivity} /></> : null}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" asChild><Link to={`/app/chats/${c.id}`}>Open chat</Link></Button>
                    <Button variant="ghost" size="sm">Snooze</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NoActivity;
