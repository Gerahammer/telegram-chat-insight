import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Calendar, GitCommit, Clock, Handshake, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { TimeAgo } from "@/components/Badges";

interface CalendarEvent {
  id: string;
  type: "commitment" | "deadline" | "agreement" | "milestone";
  title: string;
  person?: string;
  chatId: string;
  chatTitle: string;
  date: string; // ISO date
  status?: string;
}

const TYPE_CONFIG: Record<string, { icon: any; cls: string; label: string }> = {
  commitment: { icon: GitCommit,    cls: "bg-blue-500/10 text-blue-500 border-blue-500/20",       label: "Commitment" },
  deadline:   { icon: Clock,        cls: "bg-warning/10 text-warning border-warning/20",           label: "Deadline" },
  agreement:  { icon: Handshake,    cls: "bg-success/10 text-success border-success/20",           label: "Agreement" },
  milestone:  { icon: AlertTriangle,cls: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", label: "Milestone" },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(now.toISOString().slice(0, 10));

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const chatsRes = await apiFetch("/api/chats");
        if (!chatsRes.ok) return;
        const chatsData = await chatsRes.json();
        const chats = Array.isArray(chatsData) ? chatsData : (chatsData?.chats ?? []);

        const allEvents: CalendarEvent[] = [];

        await Promise.all(chats.map(async (chat: any) => {
          // Get commitments
          const cmRes = await apiFetch(`/api/chats/${chat.id}/commitments`).catch(() => null);
          if (cmRes?.ok) {
            const data = await cmRes.json();
            (data?.commitments ?? []).forEach((c: any) => {
              if (c.dueDate) {
                allEvents.push({
                  id: c.id,
                  type: "commitment",
                  title: c.commitment,
                  person: c.person,
                  chatId: chat.id,
                  chatTitle: chat.title,
                  date: c.dueDate.slice(0, 10),
                  status: c.status,
                });
              }
            });
          }

          // Get timeline events — use dueDate if set, otherwise occurredAt
          const tlRes = await apiFetch(`/api/chats/${chat.id}/timeline`).catch(() => null);
          if (tlRes?.ok) {
            const data = await tlRes.json();
            (data?.events ?? []).forEach((e: any) => {
              const date = (e.dueDate || e.occurredAt)?.slice(0, 10);
              if (!date) return;
              allEvents.push({
                id: e.id,
                type: e.type?.toLowerCase() === "deadline" ? "deadline" :
                      e.type?.toLowerCase() === "agreement" ? "agreement" :
                      e.type?.toLowerCase() === "milestone" ? "milestone" : "deadline",
                title: e.title,
                chatId: chat.id,
                chatTitle: chat.title,
                date,
              });
            });
          }
        }));

        setEvents(allEvents);
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const todayStr = new Date().toISOString().slice(0, 10);

  const getEventsForDay = (day: number, y: number = year, m: number = month) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.date === dateStr);
  };

  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

  // Upcoming events (next 7 days)
  const upcoming = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1">Commitments, deadlines and important dates from your chats.</p>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Calendar - 2 months */}
        <Card className="xl:col-span-2 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDate(now.toISOString().slice(0, 10)); }}>Today</Button>
              <Button variant="outline" size="sm" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
          {[0, 1].map(offset => {
            const mOffset = (month + offset) % 12;
            const yOffset = year + Math.floor((month + offset) / 12);
            const daysInM = getDaysInMonth(yOffset, mOffset);
            const firstD = getFirstDayOfMonth(yOffset, mOffset);
            return (
            <div key={offset}>
              <h3 className="font-medium text-sm mb-3 text-center">{MONTHS[mOffset]} {yOffset}</h3>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          {loading ? <Skeleton className="h-48 w-full" /> : (
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstD }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInM }, (_, i) => i + 1).map(day => {

                const dayEvents = getEventsForDay(day, yOffset, mOffset);
                const dateStr = `${yOffset}-${String(mOffset + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const isPast = dateStr < todayStr;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                    className={`
                      relative min-h-[60px] p-1.5 rounded-lg border text-left transition
                      ${isSelected ? "border-primary bg-primary/10" : "border-transparent hover:border-border hover:bg-muted/50"}
                      ${isToday ? "font-bold" : ""}
                      ${isPast && !isToday ? "opacity-60" : ""}
                    `}
                  >
                    <span className={`text-sm ${isToday ? "h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center" : ""}`}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map((e, i) => {
                        const cfg = TYPE_CONFIG[e.type] ?? TYPE_CONFIG.deadline;
                        return (
                          <div key={i} className={`text-xs px-1 py-0.5 rounded truncate ${cfg.cls}`}>
                            {e.title.slice(0, 20)}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">+{dayEvents.length - 2} more</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
            </div>
            );
          })}
          </div>

          {/* Selected day events */}
          {selectedDate && (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-semibold mb-3 text-sm">
                {new Date(selectedDate!).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                {" · "}{selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(e => {
                    const cfg = TYPE_CONFIG[e.type] ?? TYPE_CONFIG.deadline;
                    const Icon = cfg.icon;
                    return (
                      <Link key={e.id} to={`/app/chats/${e.chatId}`}>
                        <div className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.cls} hover:opacity-80 transition`}>
                          <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{e.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs opacity-70">
                              {e.person && <span>{e.person}</span>}
                              <span>{e.chatTitle}</span>
                            </div>
                          </div>
                          {e.status && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {e.status.toLowerCase()}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Upcoming sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4" /> Upcoming
            </h2>
            {loading ? (
              <div className="space-y-2"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(e => {
                  const cfg = TYPE_CONFIG[e.type] ?? TYPE_CONFIG.deadline;
                  const Icon = cfg.icon;
                  const eventDate = new Date(e.date);
                  const isToday = e.date === todayStr;
                  const isTomorrow = e.date === new Date(Date.now() + 86400000).toISOString().slice(0, 10);

                  return (
                    <Link key={e.id} to={`/app/chats/${e.chatId}`}>
                      <div className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/40 transition">
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.cls.split(' ')[1]}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{e.title}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="text-xs text-muted-foreground">{e.chatTitle}</span>
                            <span className={`text-xs font-medium ${isToday ? "text-destructive" : isTomorrow ? "text-warning" : "text-muted-foreground"}`}>
                              {isToday ? "Today" : isTomorrow ? "Tomorrow" : eventDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Legend */}
          <Card className="p-5">
            <h2 className="font-semibold mb-3 text-sm">Legend</h2>
            <div className="space-y-2">
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={type} className="flex items-center gap-2 text-sm">
                    <div className={`h-6 w-6 rounded flex items-center justify-center ${cfg.cls}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
