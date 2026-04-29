import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PriorityBadge, StatusBadge, TimeAgo } from "@/components/Badges";
import { Search, ListTodo } from "lucide-react";
import { actionItems, chats } from "@/lib/mock-data";

const ActionItems = () => {
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [chat, setChat] = useState("all");
  const [q, setQ] = useState("");

  const list = actionItems.filter((a) => {
    if (q && !a.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (priority !== "all" && a.priority !== priority) return false;
    if (status !== "all" && a.status !== status) return false;
    if (chat !== "all" && a.chatId !== chat) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Action items</h1>
        <p className="text-muted-foreground mt-1">Every request and unanswered question detected across your chats.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action items..." className="pl-9" />
          </div>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
          <Select value={chat} onValueChange={setChat}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Chat" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All chats</SelectItem>
              {chats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="space-y-3">
        {list.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            <ListTodo className="h-10 w-10 mx-auto mb-3 opacity-40" />
            No action items match your filters.
          </Card>
        )}
        {list.map((a) => (
          <Card key={a.id} className="p-5 hover:shadow-md transition">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{a.title}</h3>
                  <PriorityBadge priority={a.priority} />
                  <StatusBadge status={a.status} />
                </div>
                <p className="text-sm text-muted-foreground mt-1.5">{a.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span>📁 {a.chatName}</span>
                  <span>👤 {a.requestedBy}</span>
                  <TimeAgo iso={a.createdAt} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">Mark in progress</Button>
                <Button size="sm" className="gradient-primary border-0">Resolve</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ActionItems;
