import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { apiFetch, getAuthToken } from "@/lib/api";
import { toast } from "sonner";

interface InvitePreview {
  email: string;
  role: string;
  expiresAt: string;
  company: { name: string; slug: string };
}

const AcceptInvite = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) { setError("Missing invite token"); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`/api/invites/preview/${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || "Invite is invalid or expired");
        if (!cancelled) setPreview(data.invite);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Invite is invalid or expired");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const accept = async () => {
    setAccepting(true);
    try {
      const res = await apiFetch(`/api/invites/accept/${encodeURIComponent(token)}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to accept invite");
      toast.success("Welcome to the workspace!");
      navigate("/app");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <AuthLayout title="Loading invite…" subtitle="One moment" footer={null}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout
        title="Invite unavailable"
        subtitle={error}
        footer={<Link to="/login" className="text-primary font-medium">Back to sign in</Link>}
      >
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm">
            This invite link can't be used. It may have expired or already been accepted.
            Ask whoever sent it to generate a new one.
          </div>
        </div>
      </AuthLayout>
    );
  }

  // No preview, no error — shouldn't happen, but guard
  if (!preview) return null;

  const isLoggedIn = !!getAuthToken();
  const inviteEncoded = encodeURIComponent(token);

  return (
    <AuthLayout
      title={`Join ${preview.company.name}`}
      subtitle={`You've been invited as ${preview.role.toLowerCase()}.`}
      footer={
        isLoggedIn ? (
          <Link to="/app" className="text-muted-foreground">Cancel</Link>
        ) : (
          <Link to="/login" className="text-muted-foreground">Already have an account? Sign in</Link>
        )
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <div>Invite for <span className="font-medium">{preview.email}</span></div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Expires {new Date(preview.expiresAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {isLoggedIn ? (
          <Button onClick={accept} disabled={accepting} className="w-full gradient-primary border-0">
            {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Join ${preview.company.name}`}
          </Button>
        ) : (
          <div className="space-y-2">
            <Link to={`/register?invite=${inviteEncoded}&email=${encodeURIComponent(preview.email)}`} className="block">
              <Button className="w-full gradient-primary border-0">Create an account</Button>
            </Link>
            <Link to={`/login?invite=${inviteEncoded}`} className="block">
              <Button variant="outline" className="w-full">I already have an account</Button>
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default AcceptInvite;
