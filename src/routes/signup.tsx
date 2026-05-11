import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, translateAuthError } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingBasket } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "הרשמה — FamilyCart" }] }),
  component: SignupPage,
});

function SignupPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!loading && user && !done) navigate({ to: "/" });
  }, [user, loading, navigate, done]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        setError(translateAuthError(error.message));
      } else if (!data.session) {
        // Email confirmation required — no session yet.
        setDone(true);
      }
      // If data.session exists, onAuthStateChange fires and the useEffect
      // above navigates to "/" once user is set, avoiding the race with AuthGate.
    } catch (err) {
      setError(translateAuthError(err instanceof Error ? err.message : "שגיאת רשת"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <ShoppingBasket className="size-7" />
            <span className="text-2xl font-semibold">FamilyCart</span>
          </div>
          <h1 className="text-xl font-semibold">הרשמה</h1>
        </div>
        {done ? (
          <div className="text-center space-y-4">
            <p className="text-sm">נשלח אליך מייל לאימות — אנא אשר את כתובת המייל שלך</p>
            <Link to="/login" className="text-primary font-medium text-sm">חזרה להתחברות</Link>
          </div>
        ) : (
          <>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">אימייל</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "נרשם..." : "הירשם"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                בהרשמה אתה מסכים לשמירת הנתונים שלך לצורך פעולת האפליקציה
              </p>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              יש לך חשבון? <Link to="/login" className="text-primary font-medium">התחבר</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
