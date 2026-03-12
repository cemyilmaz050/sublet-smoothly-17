import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/** Returns whether the current user has at least one active/pending listing. */
const useHasPublishedListing = () => {
  const { user } = useAuth();
  const [hasListing, setHasListing] = useState(false);

  const check = useCallback(async () => {
    if (!user) { setHasListing(false); return; }
    const { count } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", user.id)
      .in("status", ["active", "pending"]);
    setHasListing((count ?? 0) > 0);
  }, [user]);

  useEffect(() => { check(); }, [check]);

  // Real-time: re-check when listings change
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("has-listing-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "listings" }, () => check())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, check]);

  return { hasListing, refresh: check };
};

export default useHasPublishedListing;
