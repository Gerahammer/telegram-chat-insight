import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, ArrowRight, Building2, Bot, MessagesSquare,
  Sparkles, Check, Copy, Loader2, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, getAuthToken } from "@/lib/api";

const BOT_USERNAME = "@Sumerz_bot";

const steps = [
  { title: "Create workspace", icon: Building2 },
  { title: "Add bot",          icon: Bot },
  { title: "Connect chat",     icon: MessagesSquare },
  { title: "First insight",    icon: Sparkles },
];

interface SummaryPreview {
  summaryText: string;
  requiresAttention: boolean;
  sentiment: string;
  actionItems?: { title: string }[];
}

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const [connectionToken, setConnectionToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workspaceCreated, setWorkspaceCreated] = useState(false);

  // Step 2: polling for first connected chat
  const [detectedChat, setDetectedChat] = useState<{ id: string; title: string } | null>(null);
  const [chatPolling, setChatPolling] = useState(false);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 3: live summary generation
  const [summaryGenerating, setSummaryGenerating] = useState(false);
  const [summaryPreview, setSummaryPreview] = useState<SummaryPreview | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const summaryTriggered = useRef(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!getAuthToken()) {
      toast.error("Please sign in to continue onboarding");
      navigate("/login");
    }
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [navigate]);

  // Start polling for chats when user reaches step 2
  useEffect(() => {
    if (step !== 2) {
      if (chatPollRef.current) { clearInterval(chatPollRef.current); chatPollRef.current = null; }
      setChatPolling(false);
      return;
    }
    if (detectedChat) return; // already found

    setChatPolling(true);
    const poll = async () => {
      try {
        const res = await apiFetch("/api/chats");
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.chats ?? []);
        if (list.length > 0) {
          const chat = list[0];
          setDetectedChat({ id: chat.id, title: chat.title });
          setChatPolling(false);
          if (chatPollRef.current) { clearInterval(chatPollRef.current); chatPollRef.current = null; }
          // Auto-advance after a short delay so user sees the success state
          setTimeout(() => setStep(3), 1800);
        }
      } catch { /* network blip — retry next tick */ }
    };
    poll(); // immediate first check
    chatPollRef.current = setInterval(poll, 3000);
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [step, detectedChat]);

  // Trigger summary generation when step 3 loads
  useEffect(() => {
    if (step !== 3 || !detectedChat || summaryTriggered.current) return;
    summaryTriggered.current = true;

    const generate = async () => {
      setSummaryGenerating(true);
      setSummaryError(null);
      try {
        await apiFetch(`/api/chats/${encodeURIComponent(detectedChat.id)}/generate-summary?force=true`, { method: "POST" });
      } catch { /* non-fatal — poll anyway */ }

      // Poll until summary appears (max ~90s)
      let attempts = 0;
      const poll = async () => {
        if (attempts++ > 30) {
          setSummaryGenerating(false);
          setSummaryError("Taking longer than usual — your first summary will be ready by tomorrow morning.");
          return;
        }
        try {
          const res = await apiFetch(`/api/chats/${encodeURIComponent(detectedChat.id)}/summaries`);
          if (!res.ok) { setTimeout(poll, 3000); return; }
          const data = await res.json();
          const summaries = Array.isArray(data) ? data : (data?.summaries ?? []);
          const s = summaries.find((x: any) => !x.noActivity);
          if (s) {
            setSummaryPreview({
              summaryText: s.summaryText ?? "",
              requiresAttention: s.requiresAttention ?? false,
              sentiment: s.sentiment ?? "NEUTRAL",
              actionItems: s.actionItems ?? [],
            });
            setSummaryGenerating(false);
          } else {
            setTimeout(poll, 3000);
          }
        } catch { setTimeout(poll, 3000); }
      };
      setTimeout(poll, 4000);
    };
    generate();
  }, [step, detectedChat]);

  const fetchConnectionToken = async () => {
    setTokenLoading(true);
    try {
      const res = await apiFetch("/api/workspaces/current/connection-token");
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setConnectionToken(data.connectionToken ?? null);
    } catch {
      toast.error("Could not fetch connection token");
    } finally {
      setTokenLoading(false);
    }
  };

  const createWorkspaceAndContinue = async () => {
    if (workspaceCreated) { setStep(1); return; }
    if (!workspaceName.trim()) { toast.error("Please enter a workspace name"); return; }
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: workspaceName.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.message || `${res.status}`);
      }
      setWorkspaceCreated(true);
      setStep(1);
      fetchConnectionToken();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (step === 0) return createWorkspaceAndContinue();
    if (step === 3) return navigate("/app");
    setStep(s => Math.min(s + 1, 3));
  };
  const back = () => setStep(s => Math.max(0, s - 1));

  const sentimentColor: Record<string, string> = {
    POSITIVE: "text-success", NEGATIVE: "text-destructive", NEUTRAL: "text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      <header className="container py-6"><Logo /></header>
      <div className="flex-1 container max-w-2xl py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3 text-sm text-muted-foreground">
            <span>Step {step + 1} of {steps.length}</span>
            <span>{Math.round(((step + 1) / steps.length) * 100)}% complete</span>
          </div>
          <Progress value={((step + 1) / steps.length) * 100} className="h-2" />
          <div className="mt-6 flex justify-between">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.title} className="flex flex-col items-center gap-2 flex-1">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition ${active ? "gradient-primary text-primary-foreground shadow-glow" : done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                    {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs text-center hidden sm:block ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}>{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="p-8">
          {/* ── Step 0: Create workspace ──────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Create your workspace</h2>
                <p className="text-muted-foreground mt-1">A workspace holds your team, chats, and summaries.</p>
              </div>
              <div className="space-y-2">
                <Label>Workspace name</Label>
                <Input
                  placeholder="Acme Affiliates"
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createWorkspaceAndContinue()}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* ── Step 1: Add Telegram bot ──────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Connect the bot</h2>
                <p className="text-muted-foreground mt-1">You'll use this token to link your first Telegram group.</p>
              </div>
              <Card className="p-6 bg-secondary border-dashed text-center space-y-3">
                <Bot className="h-12 w-12 mx-auto text-primary" />
                <div className="font-mono font-semibold text-lg">{BOT_USERNAME}</div>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(BOT_USERNAME); toast.success("Copied!"); }}>
                  <Copy className="h-3 w-3 mr-2" /> Copy
                </Button>
              </Card>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                <div className="text-xs text-muted-foreground">Your connection token</div>
                <div className="font-mono text-2xl font-bold tracking-widest mt-1 break-all">
                  {tokenLoading ? "Loading…" : connectionToken ?? "—"}
                </div>
                {connectionToken && (
                  <Button variant="outline" size="sm" className="mt-3"
                    onClick={() => { navigator.clipboard.writeText(connectionToken); toast.success("Copied!"); }}>
                    <Copy className="h-3 w-3 mr-2" /> Copy token
                  </Button>
                )}
              </div>
              <ol className="space-y-3 text-sm">
                {[
                  `Open Telegram and message ${BOT_USERNAME}`,
                  "Send: /connect [your token above]",
                  "The bot will ask which group to connect",
                ].map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">{i + 1}</div>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* ── Step 2: Connect first chat (live polling) ─────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Connect your first chat</h2>
                <p className="text-muted-foreground mt-1">
                  Add the bot to a Telegram group with recent activity — we'll generate your first insight live.
                </p>
              </div>
              <ol className="space-y-4 text-sm">
                {[
                  { t: "Add the bot to a Telegram group", d: "Open your group → Add member → search for " + BOT_USERNAME },
                  { t: "Send /connect in the group", d: "The bot will confirm and the chat will appear here automatically." },
                ].map((s, i) => (
                  <li key={s.t} className="flex gap-3">
                    <div className="h-7 w-7 rounded-full gradient-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">{i + 1}</div>
                    <div>
                      <div className="font-medium">{s.t}</div>
                      <div className="text-muted-foreground text-xs mt-0.5">{s.d}</div>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Live status */}
              <div className={`rounded-xl border p-4 flex items-center gap-3 transition ${detectedChat ? "border-success/40 bg-success/5" : "border-border bg-muted/30"}`}>
                {detectedChat ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-success">Chat connected!</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{detectedChat.title} — generating your first insight…</p>
                    </div>
                  </>
                ) : chatPolling ? (
                  <>
                    <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Waiting for your chat to connect…</p>
                      <p className="text-xs text-muted-foreground mt-0.5">This page will update automatically — no need to refresh.</p>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}

          {/* ── Step 3: First insight (wow moment) ───────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold">Your first insight</h2>
                <p className="text-muted-foreground mt-1">
                  {detectedChat
                    ? <>Based on <span className="font-medium text-foreground">{detectedChat.title}</span> — this is what you'll get every morning.</>
                    : "This is what you'll receive every morning."}
                </p>
              </div>

              {summaryGenerating && !summaryPreview && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
                  <Loader2 className="h-8 w-8 mx-auto text-primary animate-spin" />
                  <p className="text-sm font-medium">Analysing the last 24 hours…</p>
                  <p className="text-xs text-muted-foreground">This usually takes 20–40 seconds</p>
                </div>
              )}

              {summaryError && !summaryPreview && (
                <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground">
                  {summaryError}
                </div>
              )}

              {summaryPreview && (
                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary">AI Summary · Today</span>
                    {summaryPreview.requiresAttention && (
                      <span className="ml-auto text-xs font-medium text-warning">Needs attention</span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {summaryPreview.summaryText
                      .split("•")
                      .filter(Boolean)
                      .map((line, i) => (
                        <span key={i} className="block mb-1">• {line.trim()}</span>
                      ))}
                  </p>
                  {summaryPreview.actionItems && summaryPreview.actionItems.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Action items</p>
                      <ul className="space-y-1">
                        {summaryPreview.actionItems.slice(0, 3).map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            {a.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className={`text-xs ${sentimentColor[summaryPreview.sentiment] ?? "text-muted-foreground"}`}>
                    Sentiment: {summaryPreview.sentiment.charAt(0) + summaryPreview.sentiment.slice(1).toLowerCase()}
                  </p>
                </div>
              )}

              {!summaryGenerating && (
                <p className="text-sm text-muted-foreground">
                  You'll receive a summary like this every morning. Head to the dashboard to explore commitments, timelines, and more.
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button variant="ghost" onClick={back} disabled={step === 0 || (step === 2 && !!detectedChat)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button
              onClick={next}
              disabled={submitting || (step === 2 && !detectedChat) || (step === 3 && summaryGenerating && !summaryPreview && !summaryError)}
              className="gradient-primary border-0"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</>
              ) : step === 3 ? (
                <>Go to dashboard <ArrowRight className="h-4 w-4 ml-2" /></>
              ) : step === 2 ? (
                <>Waiting… <Loader2 className="h-4 w-4 ml-2 animate-spin" /></>
              ) : (
                <>Continue <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
