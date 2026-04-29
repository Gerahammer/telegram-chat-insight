import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, RefreshCw, CheckCircle2, Shield } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

interface ConnectChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void | Promise<void>;
}

export function ConnectChatDialog({ open, onOpenChange, onDone }: ConnectChatDialogProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const fetchToken = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/workspaces/current/connection-token");
      if (!res.ok) { setToken(null); return; }
      const data = await res.json().catch(() => null);
      setToken(data?.connectionToken ?? null);
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) fetchToken(); }, [open]);

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(`/connect ${token}`);
    toast.success("Command copied — paste it in your Telegram group");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await apiFetch("/api/workspaces/current/refresh-connection-token", { method: "POST" });
      if (!res.ok) { toast.error("Failed to refresh token"); return; }
      const data = await res.json().catch(() => null);
      setToken(data?.connectionToken ?? null);
      toast.success("New token generated");
    } catch {
      toast.error("Failed to refresh token");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDone = async () => {
    setFinishing(true);
    try { await onDone?.(); }
    finally { setFinishing(false); onOpenChange(false); }
  };

  const command = token ? `/connect ${token}` : "/connect rr_...";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect a Telegram group</DialogTitle>
          <DialogDescription>
            3 simple steps to link a group to ReplyRadar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">

          {/* Steps */}
          <ol className="space-y-4 text-sm">
            <li className="flex gap-3 items-start">
              <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</div>
              <div>
                <div className="font-semibold mb-0.5">Add @Sumerz_bot to your group</div>
                <div className="text-muted-foreground text-xs">No admin role needed — just add as a regular member.</div>
              </div>
            </li>

            <li className="flex gap-3 items-start">
              <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</div>
              <div className="flex-1">
                <div className="font-semibold mb-2">Send this command in the group</div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border">
                  <code className="font-mono text-sm font-bold flex-1 break-all">
                    {loading ? <Skeleton className="h-5 w-32 inline-block" /> : command}
                  </code>
                  <Button variant="outline" size="sm" disabled={!token || loading} onClick={handleCopy} className="shrink-0">
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 shrink-0" />
                  <span>The bot deletes this message instantly — your token stays private.</span>
                </div>
              </div>
            </li>

            <li className="flex gap-3 items-start">
              <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</div>
              <div>
                <div className="font-semibold mb-0.5">Click "Done" below</div>
                <div className="text-muted-foreground text-xs">Your group will appear in the Chats list.</div>
              </div>
            </li>
          </ol>

          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <strong>This token is one-time use.</strong> Once connected, it's invalidated automatically.
            If you need to connect another group, click "New token" to get a fresh one.
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing || loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            New token
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
