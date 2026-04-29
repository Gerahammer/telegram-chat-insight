import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "./api";

interface WorkspaceStats {
  chatsCount: number | null;
  openActionsCount: number | null;
  noActivityCount: number | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const WorkspaceStatsContext = createContext<WorkspaceStats>({
  chatsCount: null,
  openActionsCount: null,
  noActivityCount: null,
  loading: true,
  refresh: async () => {},
});

function extractArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    // Our API returns { chats: [...] } or { actionItems: [...] } or { items: [...] }
    if (Array.isArray(o.chats)) return o.chats;
    if (Array.isArray(o.actionItems)) return o.actionItems;
    if (Array.isArray(o.items)) return o.items;
    if (typeof o.total === "number") return new Array(o.total);
    if (typeof o.count === "number") return new Array(o.count);
  }
  return [];
}

async function safeJson(res: Response | null): Promise<unknown | null> {
  if (!res || !res.ok) return null;
  try { return await res.json(); } catch { return null; }
}

export function WorkspaceStatsProvider({ children }: { children: ReactNode }) {
  const [chatsCount, setChatsCount] = useState<number | null>(null);
  const [openActionsCount, setOpenActionsCount] = useState<number | null>(null);
  const [noActivityCount, setNoActivityCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const [chatsRes, actionsRes, overviewRes] = await Promise.all([
      apiFetch("/api/chats").catch(() => null),
      apiFetch("/api/action-items?status=OPEN").catch(() => null),
      apiFetch("/api/dashboard/overview").catch(() => null),
    ]);
    const chats = await safeJson(chatsRes);
    const actions = await safeJson(actionsRes);
    const overview = (await safeJson(overviewRes)) as
      | { chatsWithNoActivity?: number; openActionItems?: number }
      | null;

    setChatsCount(extractArray(chats).length);
    // Prefer the accurate count from overview if available
    setOpenActionsCount(overview?.openActionItems ?? extractArray(actions).length);
    setNoActivityCount(overview?.chatsWithNoActivity ?? 0);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

  return (
    <WorkspaceStatsContext.Provider
      value={{ chatsCount, openActionsCount, noActivityCount, loading, refresh }}
    >
      {children}
    </WorkspaceStatsContext.Provider>
  );
}

export function useWorkspaceStats() {
  return useContext(WorkspaceStatsContext);
}
