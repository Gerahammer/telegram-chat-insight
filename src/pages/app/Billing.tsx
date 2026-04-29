import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CreditCard } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const plans = [
  { name: "Starter", price: 29, chats: "Up to 5 chats", features: ["Daily AI summaries", "Action items", "Email digest"] },
  { name: "Pro", price: 79, chats: "Up to 25 chats", features: ["Everything in Starter", "Sentiment tracking", "Slack integration", "Priority support"], current: true },
  { name: "Business", price: 199, chats: "Up to 100 chats", features: ["Everything in Pro", "Team workspaces", "API access", "SSO"] },
  { name: "Enterprise", price: null, chats: "Unlimited", features: ["Everything in Business", "EU hosting", "Custom retention", "Dedicated support"] },
];

const Billing = () => {
  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and payment method.</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge className="gradient-primary border-0 mb-2">Current plan</Badge>
            <h2 className="text-2xl font-bold">Pro</h2>
            <p className="text-sm text-muted-foreground">$79/month · renews on May 29, 2026</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Cancel plan</Button>
            <Button className="gradient-primary border-0">Upgrade</Button>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2"><span className="text-muted-foreground">Chat usage</span><span className="font-medium">7 of 25 chats</span></div>
          <Progress value={28} className="h-2" />
        </div>
      </Card>

      <div>
        <h2 className="font-semibold text-lg mb-4">All plans</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <Card key={p.name} className={`p-6 ${p.current ? "border-primary shadow-glow" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                {p.current && <Badge variant="outline" className="text-xs border-primary/30 text-primary">Current</Badge>}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold">{p.price ? `$${p.price}` : "Custom"}</span>
                {p.price && <span className="text-sm text-muted-foreground">/mo</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{p.chats}</p>
              <Button variant={p.current ? "outline" : "default"} className={`w-full mt-4 ${!p.current ? "gradient-primary border-0" : ""}`} disabled={p.current}>
                {p.current ? "Current plan" : p.price ? "Upgrade" : "Contact sales"}
              </Button>
              <ul className="mt-4 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />{f}</li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Payment method</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-14 rounded-md bg-secondary flex items-center justify-center"><CreditCard className="h-5 w-5" /></div>
            <div>
              <div className="font-medium text-sm">Visa ending in 4242</div>
              <div className="text-xs text-muted-foreground">Expires 12/2027</div>
            </div>
          </div>
          <Button variant="outline" size="sm">Update</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Invoice history</h2>
        <div className="space-y-2 text-sm">
          {[
            { date: "April 29, 2026", amount: "$79.00" },
            { date: "March 29, 2026", amount: "$79.00" },
            { date: "February 28, 2026", amount: "$79.00" },
          ].map((i) => (
            <div key={i.date} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <div className="font-medium">{i.date}</div>
                <div className="text-xs text-muted-foreground">Pro plan</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium">{i.amount}</span>
                <Button variant="ghost" size="sm">Download</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Billing;
