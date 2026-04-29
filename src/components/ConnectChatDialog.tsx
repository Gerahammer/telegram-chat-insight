import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, RefreshCw, ShieldAlert, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface ConnectChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the user clicks "Done" — typically to refresh the chats list. */
  onDone?: () => void | Promise<void>;
}

export function ConnectChatDialog({ open, onOpenChange, onDone }: ConnectChatDialogProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const fetchToken = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/workspaces/current/connection-token");
      if (!res.ok) {
        setToken(null);
        return;
      }
      const data = await res.json().catch(() => null);
      setToken(data?.connectionToken ?? data?.token ?? null);
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchToken();
  }, [open]);

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    toast.success("Token copied");
  };

  const handleRefreshToken = async () => {
    setRefreshingToken(true);
    try {
      const res = await apiFetch("/api/workspaces/current/refresh-connection-token", { method: "POST" });
      if (!res.ok) {
        toast.error("Failed to refresh token");
        return;
      }
      const data = await res.json().catch(() => null);
      const newToken = data?.connectionToken ?? data?.token ?? null;
      if (newToken) {
        setToken(newToken);
        toast.success("Token refreshed");
      } else {
        await fetchToken();
      }
    } catch {
      toast.error("Failed to refresh token");
    } finally {
      setRefreshingToken(false);
    }
  };

  const handleDone = async () => {
    setFinishing(true);
    try {
      await onDone?.();
    } finally {
      setFinishing(false);
      onOpenChange(false);
    }
  };

  const cmdPrivate = token ? `/connect ${token}` : "/connect [token]";
  const cmdGroup = token ? `/connectgroup ${token}` : "/connectgroup [token]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Connect a Telegram chat</DialogTitle>
          <DialogDescription>
            Use your workspace token to link @Sumerz_bot to a group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
            <div className="text-xs text-muted-foreground mb-1">Your connection token</div>
            <div className="flex items-center justify-between gap-3">
              <div className="font-mono text-xl font-bold break-all">
                {loading ? <Skeleton className="h-7 w-40" /> : token ?? "Unavailable"}
              </div>
              <Button variant="outline" size="sm" disabled={!token || loading} onClick={handleCopy}>
                <Copy className="h-3.5 w-3.5 mr-2" /> Copy
              </Button>
            </div>
          </div>

          <ol className="space-y-3 text-sm">
            <li className="flex gap-3 items-start">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">1</div>
              <div>
                Send a private message to{" "}
                <span className="font-mono font-semibold text-foreground">@Sumerz_bot</span>:
                <div className="mt-1 font-mono text-xs bg-muted px-2 py-1 rounded inline-block">{cmdPrivate}</div>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">2</div>
              <span>The bot will confirm — then add <span className="font-mono font-semibold text-foreground">@Sumerz_bot</span> as admin to your group.</span>
            </li>
            <li className="flex gap-3 items-start">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">3</div>
              <div>
                Send <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{cmdGroup}</span> in the group (the bot deletes it automatically).
              </div>
            </li>
          </ol>

          <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="text-xs">Never paste your token in a group chat.</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={handleRefreshToken} disabled={refreshingToken || loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshingToken ? "animate-spin" : ""}`} />
            Refresh token
          </Button>
          <Button onClick={handleDone} disabled={finishing}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Done — refresh chat list
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
