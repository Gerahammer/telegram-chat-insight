import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const navigate = useNavigate();
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your ReplyRadar workspace"
      footer={<>Don't have an account? <Link to="/register" className="text-primary font-medium">Sign up</Link></>}
    >
      <form onSubmit={(e) => { e.preventDefault(); navigate("/app"); }} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" placeholder="you@company.com" defaultValue="jordan@acme.io" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary">Forgot?</Link>
          </div>
          <Input id="password" type="password" defaultValue="demo1234" />
        </div>
        <Button type="submit" className="w-full gradient-primary border-0">Sign in</Button>
      </form>
    </AuthLayout>
  );
};

export default Login;
