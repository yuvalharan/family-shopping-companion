import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth, translateAuthError } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBasket } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "התחברות — FamilyCart" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(translateAuthError(error.message));
      // Navigation is handled by the useEffect above once onAuthStateChange
      // fires and user is set — navigating here races with AuthGate.
    } catch (err) {
      setError(translateAuthError(err instanceof Error ? err.message : "שגיאת רשת"));
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError(translateAuthError(result.error.message ?? "Google"));
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <ShoppingBasket className="size-7" />
            <span className="text-2xl font-semibold">FamilyCart</span>
          </div>
          <h1 className="text-xl font-semibold">התחברות</h1>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "מתחבר..." : "התחבר"}
          </Button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">או</span></div>
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={onGoogle}>
          התחבר עם Google
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          אין לך חשבון? <Link to="/signup" className="text-primary font-medium">הירשם</Link>
        </p>
      </div>
    </div>
  );
}
