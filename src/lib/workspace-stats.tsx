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

function arrayLen(data: unknown): number {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === "object") {
    const o = data as { items?: unknown[]; total?: number; count?: number };
    if (typeof o.total === "number") return o.total;
    if (typeof o.count === "number") return o.count;
    if (Array.isArray(o.items)) return o.items.length;
  }
  return 0;
}

async function safeJson(res: Response | null): Promise<unknown | null> {
  if (!res || !res.ok) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
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
      | { chatsWithNoActivity?: number; noActivity?: number }
      | null;

    setChatsCount(chats === null ? 0 : arrayLen(chats));
    setOpenActionsCount(actions === null ? 0 : arrayLen(actions));
    setNoActivityCount(overview?.chatsWithNoActivity ?? overview?.noActivity ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

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
