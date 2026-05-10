import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
        setSession(s);
        setLoading(false);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session);
        setLoading(false);
      }).catch(() => setLoading(false));
    } catch {
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, []);

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

export function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("email not confirmed")) return "יש לאמת את כתובת המייל לפני הכניסה";
  if (m.includes("invalid login")) return "אימייל או סיסמה שגויים";
  if (m.includes("user already registered") || m.includes("already registered"))
    return "משתמש עם כתובת מייל זו כבר קיים";
  if (m.includes("password") && m.includes("6")) return "הסיסמה חייבת להכיל לפחות 6 תווים";
  if (m.includes("invalid email")) return "כתובת מייל לא תקינה";
  return "שגיאה: " + msg;
}
