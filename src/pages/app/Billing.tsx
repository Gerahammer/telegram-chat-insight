import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, CreditCard, Inbox } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { apiFetch } from "@/lib/api";

interface Plan {
  id?: string;
  name: string;
  price: number | null;
  chats?: string;
  features?: string[];
  current?: boolean;
}

interface Subscription {
  planName?: string;
  price?: number;
  renewsOn?: string;
  chatsUsed?: number;
  chatsLimit?: number;
  paymentMethod?: { brand?: string; last4?: string; expires?: string };
}

interface Invoice { id: string; date: string; amount: string; description?: string; }

const Billing = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [subRes, plansRes, invRes] = await Promise.all([
        apiFetch("/api/billing/subscription").catch(() => null),
        apiFetch("/api/billing/plans").catch(() => null),
        apiFetch("/api/billing/invoices").catch(() => null),
      ]);
      if (subRes?.ok) {
        try { if (!cancelled) setSubscription(await subRes.json()); } catch { /* empty */ }
      }
      if (plansRes?.ok) {
        try {
          const data = await plansRes.json();
          if (!cancelled) setPlans(Array.isArray(data) ? data : data?.items ?? []);
        } catch { /* empty */ }
      }
      if (invRes?.ok) {
        try {
          const data = await invRes.json();
          if (!cancelled) setInvoices(Array.isArray(data) ? data : data?.items ?? []);
        } catch { /* empty */ }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const usagePct =
    subscription?.chatsUsed && subscription?.chatsLimit
      ? Math.min(100, Math.round((subscription.chatsUsed / subscription.chatsLimit) * 100))
      : 0;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and payment method.</p>
      </div>

      <Card className="p-6">
        {loading ? (
          <Skeleton className="h-32 w-full" />
        ) : !subscription ? (
          <div className="text-center text-muted-foreground py-8">
            <Inbox className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No active subscription.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <Badge className="gradient-primary border-0 mb-2">Current plan</Badge>
                <h2 className="text-2xl font-bold">{subscription.planName ?? "—"}</h2>
                <p className="text-sm text-muted-foreground">
                  {subscription.price != null ? `$${subscription.price}/month` : ""}
                  {subscription.renewsOn ? ` · renews on ${subscription.renewsOn}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Cancel plan</Button>
                <Button className="gradient-primary border-0">Upgrade</Button>
              </div>
            </div>
            {subscription.chatsLimit != null && (
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Chat usage</span>
                  <span className="font-medium">{subscription.chatsUsed ?? 0} of {subscription.chatsLimit} chats</span>
                </div>
                <Progress value={usagePct} className="h-2" />
              </div>
            )}
          </>
        )}
      </Card>

      <div>
        <h2 className="font-semibold text-lg mb-4">All plans</h2>
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : plans.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">No plans available.</Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((p) => (
              <Card key={p.id ?? p.name} className={`p-6 ${p.current ? "border-primary shadow-glow" : ""}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.current && <Badge variant="outline" className="text-xs border-primary/30 text-primary">Current</Badge>}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{p.price != null ? `$${p.price}` : "Custom"}</span>
                  {p.price != null && <span className="text-sm text-muted-foreground">/mo</span>}
                </div>
                {p.chats && <p className="text-sm text-muted-foreground mt-1">{p.chats}</p>}
                <Button variant={p.current ? "outline" : "default"} className={`w-full mt-4 ${!p.current ? "gradient-primary border-0" : ""}`} disabled={p.current}>
                  {p.current ? "Current plan" : p.price != null ? "Upgrade" : "Contact sales"}
                </Button>
                {p.features && (
                  <ul className="mt-4 space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />{f}</li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Payment method</h2>
        {loading ? (
          <Skeleton className="h-12 w-full" />
        ) : !subscription?.paymentMethod ? (
          <p className="text-sm text-muted-foreground">No payment method on file.</p>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-14 rounded-md bg-secondary flex items-center justify-center"><CreditCard className="h-5 w-5" /></div>
              <div>
                <div className="font-medium text-sm">
                  {subscription.paymentMethod.brand ?? "Card"}
                  {subscription.paymentMethod.last4 ? ` ending in ${subscription.paymentMethod.last4}` : ""}
                </div>
                {subscription.paymentMethod.expires && (
                  <div className="text-xs text-muted-foreground">Expires {subscription.paymentMethod.expires}</div>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm">Update</Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Invoice history</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <div className="space-y-2 text-sm">
            {invoices.map((i) => (
              <div key={i.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <div className="font-medium">{i.date}</div>
                  {i.description && <div className="text-xs text-muted-foreground">{i.description}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{i.amount}</span>
                  <Button variant="ghost" size="sm">Download</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Billing;
