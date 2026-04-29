import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Building2, Bot, MessagesSquare, Check, Copy, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

const BOT_USERNAME = "@Sumerz_bot";

const steps = [
  { title: "Create workspace", icon: Building2 },
  { title: "Add Telegram bot", icon: Bot },
  { title: "Connect first chat", icon: MessagesSquare },
  { title: "View dashboard", icon: LayoutDashboard },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const next = () => (step < 3 ? setStep(step + 1) : navigate("/app"));
  const back = () => setStep(Math.max(0, step - 1));

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col">
      <header className="container py-6"><Logo /></header>
      <div className="flex-1 container max-w-2xl py-8">
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
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Create your workspace</h2>
                <p className="text-muted-foreground mt-1">A workspace holds your team, chats, and summaries.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Workspace name</Label>
                  <Input placeholder="Acme Affiliates" defaultValue="Acme Affiliates" />
                </div>
                <div className="space-y-2">
                  <Label>What's your team size?</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {["1-5", "6-20", "21-50", "50+"].map((s, i) => (
                      <Button key={s} variant={i === 1 ? "default" : "outline"} className={i === 1 ? "gradient-primary border-0" : ""}>{s}</Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Add your Telegram bot</h2>
                <p className="text-muted-foreground mt-1">Open Telegram and find our bot to get started.</p>
              </div>
              <Card className="p-6 bg-secondary border-dashed text-center space-y-3">
                <Bot className="h-12 w-12 mx-auto text-primary" />
                <div className="font-mono font-semibold text-lg">@ReplyRadarBot</div>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText("@ReplyRadarBot"); toast.success("Copied!"); }}>
                  <Copy className="h-3 w-3 mr-2" /> Copy
                </Button>
              </Card>
              <ol className="space-y-3 text-sm">
                {[
                  "Open Telegram on your phone or desktop",
                  "Search for @ReplyRadarBot",
                  "Press Start and authorize with the code below",
                ].map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">{i + 1}</div>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                <div className="text-xs text-muted-foreground">Your one-time auth code</div>
                <div className="font-mono text-2xl font-bold tracking-widest mt-1">ACME-7421</div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Connect your first chat</h2>
                <p className="text-muted-foreground mt-1">Add the bot to a Telegram group and grant admin rights.</p>
              </div>
              <ol className="space-y-4 text-sm">
                {[
                  { t: "Open the Telegram group you want to monitor", d: "Pick a group with regular activity for the best demo." },
                  { t: "Tap the group name → Add member → @ReplyRadarBot", d: "The bot will join silently — no notification to members." },
                  { t: "Make the bot an admin", d: "It only needs read access. We never send messages on your behalf." },
                  { t: "Send /connect in the group", d: "The chat will appear in your dashboard within seconds." },
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
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 py-6">
              <div className="h-20 w-20 mx-auto rounded-full gradient-primary flex items-center justify-center shadow-glow animate-pulse-glow">
                <Check className="h-10 w-10 text-primary-foreground" strokeWidth={3} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">You're all set! 🎉</h2>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">Your first AI summary will be ready tomorrow morning. In the meantime, explore the dashboard with sample data.</p>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button variant="ghost" onClick={back} disabled={step === 0}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
            <Button onClick={next} className="gradient-primary border-0">
              {step === 3 ? "Go to dashboard" : "Continue"} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
