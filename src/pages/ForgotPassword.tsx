import { Link } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }).catch(() => null);
    } finally {
      // Always show success to avoid leaking which emails exist.
      setSent(true);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={sent ? "Check your inbox" : "Reset your password"}
      subtitle={sent ? "We've sent you a reset link." : "Enter your email and we'll send a reset link."}
      footer={<><Link to="/login" className="text-primary font-medium">Back to sign in</Link></>}
    >
      {sent ? (
        <div className="rounded-lg border border-success/20 bg-success/5 p-4 flex gap-3">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
          <div className="text-sm">If an account exists for that email, a reset link is on its way.</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full gradient-primary border-0">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
