import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface RenterVerificationStatus {
  idVerified: boolean;
  applicationComplete: boolean;
  cosignerConfirmed: boolean;
  isFullyVerified: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useRenterVerification = (): RenterVerificationStatus => {
  const { user } = useAuth();
  const [idVerified, setIdVerified] = useState(false);
  const [applicationComplete, setApplicationComplete] = useState(false);
  const [cosignerConfirmed, setCosignerConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id_verified, application_complete, cosigner_confirmed, renter_verified")
        .eq("id", user.id)
        .single() as any;

      setIdVerified(profile?.id_verified ?? false);
      setApplicationComplete(profile?.application_complete ?? false);
      setCosignerConfirmed(profile?.cosigner_confirmed ?? false);
    } catch {
      // defaults remain false
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const isFullyVerified = idVerified && applicationComplete && cosignerConfirmed;

  return {
    idVerified,
    applicationComplete,
    cosignerConfirmed,
    isFullyVerified,
    loading,
    refresh: fetchStatus,
  };
};
