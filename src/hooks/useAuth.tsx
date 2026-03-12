import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isReady: boolean;
  role: string | null;
  activeMode: string | null;
  onboardingComplete: boolean | null;
  documentsStatus: string | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isReady: false,
  role: null,
  activeMode: null,
  onboardingComplete: null,
  documentsStatus: null,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [documentsStatus, setDocumentsStatus] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("role, onboarding_complete, documents_status, active_mode")
      .eq("id", userId)
      .single() as any;
    setRole(data?.role ?? null);
    setActiveMode(data?.active_mode ?? "subtenant");
    setOnboardingComplete(data?.onboarding_complete ?? false);
    setDocumentsStatus(data?.documents_status ?? null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setRole(null);
          setActiveMode(null);
          setOnboardingComplete(null);
          setDocumentsStatus(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setIsReady(true));
      } else {
        setIsReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setActiveMode(null);
    setOnboardingComplete(null);
    setDocumentsStatus(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isReady, role, activeMode, onboardingComplete, documentsStatus, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
