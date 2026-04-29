import { Link } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
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
        <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" />
          </div>
          <Button type="submit" className="w-full gradient-primary border-0">Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
