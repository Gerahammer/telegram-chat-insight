import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Calendar, GitCommit, Clock, Handshake, AlertTriangle, Loader2, MessageSquare, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface CalendarEvent {
  id: string;
  type: "commitment" | "deadline" | "agreement" | "milestone";
  title: string;
  person?: string;
  chatId: string;
  chatTitle: string;
  date: string;
  status?: string;
}

interface Msg { id: string; author: string; text: string; time: string; }
interface ScoredMsg { m: Msg; highlighted: boolean; }

const TYPE_CONFIG: Record<string, { icon: any; cls: string; dot: string; chip: string; label: string }> = {
  commitment: { icon: GitCommit,    cls: "bg-blue-500/10 text-blue-500 border-blue-500/20",        dot: "bg-blue-500",   chip: "bg-blue-500/12 text-blue-600 dark:text-blue-400",    label: "Commitment" },
  deadline:   { icon: Clock,        cls: "bg-amber-500/10 text-amber-600 border-amber-500/20",     dot: "bg-amber-500",  chip: "bg-amber-500/12 text-amber-600 dark:text-amber-400", label: "Deadline" },
  agreement:  { icon: Handshake,    cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", dot: "bg-emerald-500", chip: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400", label: "Agreement" },
  milestone:  { icon: AlertTriangle,cls: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", dot: "bg-yellow-500", chip: "bg-yellow-500/12 text-yellow-600 dark:text-yellow-400", label: "Milestone" },
};

// ─── Message scoring ──────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
  "that","this","with","from","have","been","they","will","what","when",
  "where","which","there","their","about","would","could","should","these",
  "those","other","after","before","during","while","also","just","then",
  "than","into","over","some","such","more","most","only","even","back",
  "same","each","both","down","well","long","good","much","between",
  "through","against","made","make","said","need","want","know","like",
  "come","take","time","year","week","work","done","going","please","here",
]);

function findRelated(messages: Msg[], title: string, person?: string): ScoredMsg[] {
  if (!messages.length) return [];
  const scored = messages.map((m, idx) => {
    let keyScore = 0, bonus = 0;
    const txt = m.text.toLowerCase();
    const q = title.toLowerCase();
    const phrase = q.replace(/^[^a-z]+/, "").slice(0, 30);
    if (phrase.length > 8 && txt.includes(phrase)) keyScore += 8;
    const words = q.split(/\s+/).filter(w => w.length > 4 && !STOP_WORDS.has(w) && /^[a-z]/.test(w));
    keyScore += words.filter(w => txt.includes(w)).length * 2;
    if (person) {
      const parts = person.toLowerCase().split(/\s+/);
      if (parts.some(p => p.length > 2 && m.author.toLowerCase().includes(p))) bonus += 2;
    }
    return { idx, keyScore, score: keyScore + bonus };
  });
  const matched = scored.filter(x => x.keyScore >= 4).sort((a, b) => b.score - a.score).slice(0, 5);
  if (!matched.length) return [];
  const map = new Map<number, boolean>();
  for (const { idx } of matched) map.set(idx, true);
  const best = matched[0].idx;
  if (best > 0 && !map.has(best - 1)) map.set(best - 1, false);
  return [...map.entries()].sort(([a], [b]) => a - b).map(([idx, h]) => ({ m: messages[idx], highlighted: h }));
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function MsgModal({ event, messages, loading, onClose }: {
  event: CalendarEvent; messages: ScoredMsg[]; loading: boolean; onClose: () => void;
}) {
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.deadline;
  const Icon = cfg.icon;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-start gap-2 min-w-0 pr-4">
            <div className={`h-7 w-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${cfg.cls}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight">{event.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{event.chatTitle} · {cfg.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-1.5 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No matching messages found in the recent history.</p>
          ) : messages.map(({ m, highlighted }) => (
            <div key={m.id} className={`flex gap-2.5 rounded-lg px-2 py-1.5 ${highlighted ? "bg-primary/10 border border-primary/20" : "opacity-50"}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${highlighted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                {(m.author ?? "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium">{m.author}</span>
                  <span className="text-xs text-muted-foreground">{m.time ? new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                </div>
                <p className="text-sm mt-0.5 break-words">{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t shrink-0">
          <Link to={`/app/chats/${event.chatId}`} onClick={onClose}
            className="text-xs text-primary hover:underline">
            Open chat →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(now.toISOString().slice(0, 10));
  const [modal, setModal] = useState<{ event: CalendarEvent; messages: ScoredMsg[]; loading: boolean; ctrl?: AbortController } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const chatsRes = await apiFetch("/api/chats");
        if (!chatsRes.ok) return;
        const chatsData = await chatsRes.json();
        const chats = Array.isArray(chatsData) ? chatsData : (chatsData?.chats ?? []);
        const allEvents: CalendarEvent[] = [];
        await Promise.all(chats.map(async (chat: any) => {
          const cmRes = await apiFetch(`/api/chats/${chat.id}/commitments`).catch(() => null);
          if (cmRes?.ok) {
            const data = await cmRes.json();
            (data?.commitments ?? []).forEach((c: any) => {
              if (c.dueDate) allEvents.push({ id: c.id, type: "commitment", title: c.commitment, person: c.person, chatId: chat.id, chatTitle: chat.title, date: c.dueDate.slice(0, 10), status: c.status });
            });
          }
          const tlRes = await apiFetch(`/api/chats/${chat.id}/timeline`).catch(() => null);
          if (tlRes?.ok) {
            const data = await tlRes.json();
            (data?.events ?? []).forEach((e: any) => {
              const date = (e.dueDate || e.occurredAt)?.slice(0, 10);
              if (!date) return;
              allEvents.push({ id: e.id, type: e.type?.toLowerCase() === "deadline" ? "deadline" : e.type?.toLowerCase() === "agreement" ? "agreement" : e.type?.toLowerCase() === "milestone" ? "milestone" : "deadline", title: e.title, chatId: chat.id, chatTitle: chat.title, date });
            });
          }
        }));
        if (!cancelled) setEvents(allEvents);
      } catch { /* empty */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const openMessages = async (event: CalendarEvent) => {
    const ctrl = new AbortController();
    setModal({ event, messages: [], loading: true, ctrl });
    try {
      const res = await apiFetch(`/api/chats/${event.chatId}/messages`, { signal: ctrl.signal });
      if (!res.ok) { setModal(m => m && m.ctrl === ctrl ? { ...m, loading: false } : m); return; }
      const json = await res.json();
      const raw = Array.isArray(json) ? json : (json?.messages ?? []);
      const msgs: Msg[] = raw.map((m: any) => ({ id: String(m.id ?? Math.random()), author: m.senderName ?? m.author ?? "Unknown", text: m.text ?? "", time: m.sentAt ?? m.time ?? "" }));
      const scored = findRelated(msgs, event.title, event.person);
      setModal(m => m && m.ctrl === ctrl ? { ...m, messages: scored, loading: false } : m);
    } catch {
      setModal(m => m && m.ctrl === ctrl ? { ...m, loading: false } : m);
    }
  };

  const closeModal = () => {
    setModal(m => { m?.ctrl?.abort(); return null; });
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelectedDate(null); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelectedDate(null); };

  const todayStr = new Date().toISOString().slice(0, 10);
  const getEventsForDay = (day: number, y: number = year, m: number = month) => {
    const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(e => e.date === dateStr);
  };
  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];
  const upcoming = events.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {modal && <MsgModal event={modal.event} messages={modal.messages} loading={modal.loading} onClose={closeModal} />}

      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1">Commitments, deadlines and important dates from your chats.</p>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 p-6">
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
                  <div className="grid grid-cols-7 mb-2">
                    {DAYS.map(d => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
                  </div>
                  {loading ? <Skeleton className="h-48 w-full" /> : (
                    <div className="grid grid-cols-7 gap-px">
                      {Array.from({ length: firstD }).map((_, i) => <div key={`empty-${i}`} />)}
                      {Array.from({ length: daysInM }, (_, i) => i + 1).map(day => {
                        const dayEvents = getEventsForDay(day, yOffset, mOffset);
                        const dateStr = `${yOffset}-${String(mOffset + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const isToday = dateStr === todayStr;
                        const isSelected = dateStr === selectedDate;
                        const isPast = dateStr < todayStr;
                        const hasEvents = dayEvents.length > 0;
                        return (
                          <button key={day} onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                            className={`relative min-h-[76px] p-1.5 rounded-lg text-left transition-all
                              ${isSelected ? "bg-primary/8 ring-1 ring-primary ring-inset" : hasEvents ? "hover:bg-muted/60" : "hover:bg-muted/40"}
                              ${isToday && !isSelected ? "bg-primary/5" : ""}
                              ${isPast && !isToday ? "opacity-50" : ""}`}>
                            {/* Day number */}
                            <div className="flex justify-center mb-1.5">
                              <span className={`text-xs leading-none font-medium
                                ${isToday ? "h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-[10px]" :
                                  isSelected ? "text-primary font-semibold" :
                                  "text-foreground"}`}>
                                {day}
                              </span>
                            </div>
                            {/* Event chips */}
                            <div className="space-y-0.5">
                              {dayEvents.slice(0, 2).map((e, i) => {
                                const cfg = TYPE_CONFIG[e.type] ?? TYPE_CONFIG.deadline;
                                return (
                                  <div key={i} className={`flex items-center gap-1 px-1.5 py-[3px] rounded-md leading-none ${cfg.chip}`}>
                                    <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                    <span className="text-[10px] font-medium truncate">{e.title}</span>
                                  </div>
                                );
                              })}
                              {dayEvents.length > 2 && (
                                <div className="px-1.5 py-[2px] text-[10px] font-medium text-muted-foreground">
                                  +{dayEvents.length - 2} more
                                </div>
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
                {new Date(selectedDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
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
                      <div key={e.id} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.cls} cursor-pointer hover:opacity-80 transition`}
                        onClick={() => openMessages(e)}>
                        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{e.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs opacity-70">
                            {e.person && <span>{e.person}</span>}
                            <span>{e.chatTitle}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {e.status && <Badge variant="outline" className="text-xs">{e.status.toLowerCase()}</Badge>}
                          <MessageSquare className="h-3.5 w-3.5 opacity-50" />
                        </div>
                      </div>
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
                    <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/40 cursor-pointer transition"
                      onClick={() => openMessages(e)}>
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
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    </div>
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
                    <div className={`h-6 w-6 rounded flex items-center justify-center ${cfg.cls}`}><Icon className="h-3.5 w-3.5" /></div>
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
