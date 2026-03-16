import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface VerificationPollingContextType {
  isPending: boolean;
  isVerified: boolean;
  startPolling: () => void;
  stopPolling: () => void;
  checkNow: () => Promise<boolean>;
  pendingSince: number | null;
}

const VerificationPollingContext = createContext<VerificationPollingContextType>({
  isPending: false,
  isVerified: false,
  startPolling: () => {},
  stopPolling: () => {},
  checkNow: async () => false,
  pendingSince: null,
});

export const useVerificationPolling = () => useContext(VerificationPollingContext);

const POLL_INTERVAL = 30_000; // 30 seconds background poll

export const VerificationPollingProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isPending, setIsPending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [pendingSince, setPendingSince] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const checkNow = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    const { data } = await supabase
      .from("profiles")
      .select("id_verified")
      .eq("id", user.id)
      .single();
    if (data?.id_verified) {
      setIsVerified(true);
      setIsPending(false);
      setPendingSince(null);
      stopPolling();
      toast.success("You are verified on SubIn ✓", {
        description: "You can now schedule viewings and make payments.",
      });
      return true;
    }
    return false;
  }, [user, stopPolling]);

  const startPolling = useCallback(() => {
    setIsPending(true);
    setPendingSince(Date.now());
    stopPolling();
    pollRef.current = setInterval(() => {
      checkNow();
    }, POLL_INTERVAL);
  }, [checkNow, stopPolling]);

  // Check on mount if user is already verified
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id_verified")
        .eq("id", user.id)
        .single();
      if (data?.id_verified) {
        setIsVerified(true);
      }
    })();
    return () => stopPolling();
  }, [user, stopPolling]);

  return (
    <VerificationPollingContext.Provider value={{ isPending, isVerified, startPolling, stopPolling, checkNow, pendingSince }}>
      {children}
    </VerificationPollingContext.Provider>
  );
};
