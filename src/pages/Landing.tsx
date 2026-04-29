import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { ArrowRight, Bell, BrainCircuit, CheckCircle2, ListTodo, MessagesSquare, Radar, ShieldCheck, Sparkles, Zap } from "lucide-react";
import hero from "@/assets/hero.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-lg bg-background/70 border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
            <a href="#use-cases" className="hover:text-foreground transition">Use cases</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild><Link to="/login">Sign in</Link></Button>
            <Button asChild className="gradient-primary border-0 shadow-glow"><Link to="/register">Get started</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero text-white">
        <div className="absolute inset-0 opacity-30 mix-blend-screen" style={{ backgroundImage: `url(${hero})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="container relative py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur mb-6">
              <Sparkles className="h-3 w-3" /> Daily AI summaries for Telegram
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
              Never miss important <span className="gradient-text">Telegram messages</span> again
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl">
              ReplyRadar monitors your Telegram group chats and gives you daily AI summaries, action items, unanswered questions, and chats that need your attention.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="gradient-primary border-0 shadow-glow text-base h-12 px-6">
                <Link to="/register">Start free trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white h-12 px-6">
                <a href="#how">See how it works</a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-glow" /> 14-day free trial</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-glow" /> No credit card required</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary-glow" /> Setup in 2 minutes</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="features" className="container py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Stop drowning in group chats</h2>
          <p className="mt-4 text-lg text-muted-foreground">Your team is talking in 20+ Telegram groups. ReplyRadar tells you exactly where to look first.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: BrainCircuit, title: "AI daily summaries", desc: "A clear paragraph for each chat — what was discussed, what was decided, what's still open." },
            { icon: Bell, title: "Attention alerts", desc: "Instantly see which chats are urgent, which need a reply, and which are quiet." },
            { icon: ListTodo, title: "Action items detected", desc: "Every request, blocker, and unanswered question is extracted and tracked." },
            { icon: MessagesSquare, title: "Unanswered questions", desc: "Never let a partner or customer wait for a reply that fell through the cracks." },
            { icon: Zap, title: "Sentiment tracking", desc: "Catch frustrated customers and unhappy partners before things escalate." },
            { icon: ShieldCheck, title: "Privacy-first", desc: "Your data is encrypted and never used to train models. EU hosting available." },
          ].map((b) => (
            <Card key={b.title} className="p-6 border-border hover:shadow-elegant hover:-translate-y-1 transition-all">
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center mb-4 shadow-glow">
                <b.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{b.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">{b.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-secondary/50 py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Up and running in 2 minutes</h2>
            <p className="mt-4 text-lg text-muted-foreground">No code, no integrations to maintain. Just add a bot.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Add @ReplyRadarBot", desc: "Invite the bot to any of your Telegram groups." },
              { step: "2", title: "Make it admin", desc: "Required so the bot can read messages." },
              { step: "3", title: "Send /connect", desc: "The chat appears instantly in your dashboard." },
              { step: "4", title: "Get summaries", desc: "Every morning, a fresh AI digest in your inbox." },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="flex items-center justify-center h-12 w-12 rounded-full gradient-primary text-primary-foreground font-bold text-lg shadow-glow mb-4">{s.step}</div>
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="container py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for fast-moving teams</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Affiliate networks", desc: "Manage hundreds of partner chats without missing payout requests, CPA negotiations, or tracking issues." },
            { title: "Customer support", desc: "Catch frustrated users and unanswered questions across community groups." },
            { title: "Crypto & trading", desc: "Track signals, alerts, and key discussions across high-volume groups." },
            { title: "Agencies", desc: "Stay on top of client conversations across dozens of project groups." },
            { title: "Product teams", desc: "Get a daily pulse on user feedback, bug reports, and feature requests." },
            { title: "Communities", desc: "Spot tensions, trending topics, and questions that need a moderator's attention." },
          ].map((u) => (
            <Card key={u.title} className="p-6 hover:shadow-md transition">
              <h3 className="font-semibold text-lg">{u.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm">{u.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-secondary/50 py-24">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Simple, predictable pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">Start free. Scale when you're ready.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: "Starter", price: "$29", chats: "Up to 5 chats", features: ["Daily AI summaries", "Action items", "Email digest"] },
              { name: "Pro", price: "$79", chats: "Up to 25 chats", features: ["Everything in Starter", "Sentiment tracking", "Slack integration", "Priority support"], popular: true },
              { name: "Business", price: "$199", chats: "Up to 100 chats", features: ["Everything in Pro", "Team workspaces", "API access", "SSO"] },
              { name: "Enterprise", price: "Custom", chats: "Unlimited", features: ["Everything in Business", "EU hosting", "Custom retention", "Dedicated support"] },
            ].map((p) => (
              <Card key={p.name} className={`p-6 relative ${p.popular ? "border-primary shadow-glow" : ""}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold gradient-primary text-primary-foreground">Most popular</div>}
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{p.price}</span>
                  {p.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.chats}</p>
                <Button asChild className={`w-full mt-6 ${p.popular ? "gradient-primary border-0" : ""}`} variant={p.popular ? "default" : "outline"}>
                  <Link to="/register">{p.price === "Custom" ? "Contact sales" : "Start free"}</Link>
                </Button>
                <ul className="mt-6 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <Card className="gradient-hero text-white p-12 md:p-16 text-center border-0 shadow-elegant overflow-hidden relative">
          <Radar className="absolute -right-20 -bottom-20 h-72 w-72 text-white/5" />
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight relative">Stop scrolling. Start replying to what matters.</h2>
          <p className="mt-6 text-lg text-white/70 max-w-xl mx-auto relative">Join hundreds of teams using ReplyRadar to stay on top of their Telegram conversations.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 relative">
            <Button size="lg" asChild className="gradient-primary border-0 shadow-glow h-12 px-6"><Link to="/register">Start your free trial <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button size="lg" variant="outline" asChild className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white h-12 px-6"><Link to="/login">Sign in</Link></Button>
          </div>
        </Card>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <Logo />
          <div>© 2026 ReplyRadar. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
