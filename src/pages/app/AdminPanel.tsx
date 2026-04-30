import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimeAgo } from "@/components/Badges";
import {
  Users, Building2, MessagesSquare, Sparkles, Activity,
  ShieldCheck, Search, RefreshCw, TrendingUp, MessageSquare,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";

interface Overview {
  totalUsers: number;
  totalCompanies: number;
  totalChats: number;
  totalMessages: number;
  totalSummaries: number;
  newUsersToday: number;
  newUsers7d: number;
  activeChatCount: number;
  summariesToday: number;
  messageChart: { date: string; count: number }[];
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
  companies: { id: string; name: string; plan: string; role: string }[];
}

interface AdminCompany {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
  memberCount: number;
  chatCount: number;
  owner?: { email: string; name: string };
}

const PLAN_COLORS: Record<string, string> = {
  FREE:    "bg-muted text-muted-foreground",
  STARTER: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PRO:     "bg-primary/10 text-primary border-primary/20",
};

export default function AdminPanel() {
  const [tab, setTab] = useState<"overview" | "users" | "companies">("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [userQ, setUserQ] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOverview = async () => {
    const res = await apiFetch("/api/admin/overview").catch(() => null);
    if (res?.ok) setOverview(await res.json());
  };

  const fetchUsers = async (q = "") => {
    const res = await apiFetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setUsers(data.users ?? []);
    }
  };

  const fetchCompanies = async () => {
    const res = await apiFetch("/api/admin/companies").catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setCompanies(data.companies ?? []);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchOverview(), fetchUsers(), fetchCompanies()]);
      setLoading(false);
    })();
  }, []);

  const toggleAdmin = async (userId: string, current: boolean) => {
    setUpdating(userId);
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/admin`, {
        method: "PATCH",
        body: JSON.stringify({ isAdmin: !current }),
      });
      if (!res.ok) throw new Error();
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isAdmin: !current } : u));
      toast.success(current ? "Admin removed" : "Admin granted");
    } catch { toast.error("Failed to update"); }
    finally { setUpdating(null); }
  };

  const changePlan = async (companyId: string, plan: string) => {
    setUpdating(companyId);
    try {
      const res = await apiFetch(`/api/admin/companies/${companyId}/plan`, {
        method: "PATCH",
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) throw new Error();
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, plan } : c));
      toast.success("Plan updated");
    } catch { toast.error("Failed to update"); }
    finally { setUpdating(null); }
  };

  const chartData = (overview?.messageChart ?? []).map(d => ({
    day: new Date(d.date).toLocaleDateString("en-GB", { weekday: "short" }),
    messages: d.count,
  }));

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-primary" /> Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">Full system overview and management.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchOverview(); fetchUsers(); fetchCompanies(); }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {(["overview", "users", "companies"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total users",       value: overview?.totalUsers,       icon: Users,          hint: `+${overview?.newUsersToday ?? 0} today` },
              { label: "Companies",         value: overview?.totalCompanies,   icon: Building2 },
              { label: "Active chats",      value: overview?.totalChats,       icon: MessagesSquare, hint: `${overview?.activeChatCount ?? 0} active today` },
              { label: "Total messages",    value: overview?.totalMessages,    icon: MessageSquare },
              { label: "Total summaries",   value: overview?.totalSummaries,   icon: Sparkles,       hint: `${overview?.summariesToday ?? 0} today` },
              { label: "New users (7d)",    value: overview?.newUsers7d,       icon: TrendingUp },
            ].map((s, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">
                  {loading ? <Skeleton className="h-8 w-16" /> : (s.value ?? 0).toLocaleString()}
                </div>
                {s.hint && <p className="text-xs text-muted-foreground mt-1">{s.hint}</p>}
              </Card>
            ))}
          </div>

          {/* Message chart */}
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Message volume — last 7 days</h2>
            <div className="h-[200px]">
              {loading ? <Skeleton className="h-full w-full" /> : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Area type="monotone" dataKey="messages" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#adminGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={userQ} onChange={e => { setUserQ(e.target.value); fetchUsers(e.target.value); }}
                placeholder="Search by name or email..." className="pl-9" />
            </div>
          </div>

          <div className="space-y-2">
            {loading ? (
              <><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></>
            ) : users.map(u => (
              <Card key={u.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{u.name}</span>
                      <span className="text-sm text-muted-foreground">{u.email}</span>
                      {u.isAdmin && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Admin</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {u.companies.map(c => (
                        <Badge key={c.id} variant="outline" className={`text-xs ${PLAN_COLORS[c.plan]}`}>
                          {c.name} · {c.plan} · {c.role}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Joined <TimeAgo iso={u.createdAt} /></p>
                  </div>
                  <Button variant="outline" size="sm" disabled={updating === u.id}
                    onClick={() => toggleAdmin(u.id, u.isAdmin)}
                    className={u.isAdmin ? "text-destructive border-destructive/30" : ""}>
                    {u.isAdmin ? "Remove admin" : "Make admin"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Companies tab */}
      {tab === "companies" && (
        <div className="space-y-2">
          {loading ? (
            <><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></>
          ) : companies.map(c => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{c.name}</span>
                    <Badge variant="outline" className={`text-xs ${PLAN_COLORS[c.plan]}`}>{c.plan}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex gap-3">
                    <span>{c.memberCount} members</span>
                    <span>{c.chatCount} chats</span>
                    {c.owner && <span>Owner: {c.owner.name} ({c.owner.email})</span>}
                    <span>Created <TimeAgo iso={c.createdAt} /></span>
                  </div>
                </div>
                <Select value={c.plan} onValueChange={plan => changePlan(c.id, plan)}
                  disabled={updating === c.id}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="PRO">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
