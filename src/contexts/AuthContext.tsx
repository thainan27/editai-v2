import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Contexto de autenticação compartilhado em toda a aplicação
type AccountType = "cliente" | "editor" | "admin";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accountType: AccountType | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Emails com acesso admin permanente
const ADMIN_EMAILS = ["oliverinvestir@gmail.com"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Admin por email — sem precisar de banco
        if (ADMIN_EMAILS.includes(sess.user.email ?? "")) {
          setAccountType("admin");
        } else {
          setTimeout(() => loadProfile(sess.user.id), 0);
        }
      } else {
        setAccountType(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        if (ADMIN_EMAILS.includes(sess.user.email ?? "")) {
          setAccountType("admin");
        } else {
          loadProfile(sess.user.id);
        }
      }
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadProfile(uid: string) {
    const { data } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", uid)
      .maybeSingle();
    setAccountType((data?.account_type as AccountType) ?? "cliente");
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, accountType, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
