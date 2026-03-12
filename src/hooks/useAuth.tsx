import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isReady: boolean;
  role: string | null;
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
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [documentsStatus, setDocumentsStatus] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("role, onboarding_complete, documents_status")
        .eq("id", userId)
        .single() as any;
      setRole(data?.role ?? null);
      setOnboardingComplete(data?.onboarding_complete ?? false);
      setDocumentsStatus(data?.documents_status ?? null);
    } catch {
      setRole(null);
      setOnboardingComplete(false);
      setDocumentsStatus(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    // Set up auth listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Fetch profile and only mark ready after it completes
          await fetchProfile(newSession.user.id);
          if (mounted) setIsReady(true);
        } else {
          setRole(null);
          setOnboardingComplete(null);
          setDocumentsStatus(null);
          if (mounted) setIsReady(true);
        }
      }
    );

    // THEN check existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!mounted) return;
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        await fetchProfile(existingSession.user.id);
      }
      if (mounted) setIsReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setOnboardingComplete(null);
    setDocumentsStatus(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isReady, role, onboardingComplete, documentsStatus, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
