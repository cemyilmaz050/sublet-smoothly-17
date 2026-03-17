import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, User, CheckCircle2, Clock, AlertTriangle, Fingerprint, Home, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const ManagerBackgroundChecks = () => {
  const { user } = useAuth();

  const { data: checks = [], isLoading } = useQuery({
    queryKey: ["mgr-bg-checks-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get all listings for this manager
      const { data: listings } = await supabase.from("listings").select("id, headline, address").eq("manager_id", user!.id);
      if (!listings?.length) return [];

      // Get all applications for those listings
      const { data: apps } = await supabase
        .from("applications")
        .select("id, applicant_id, listing_id")
        .in("listing_id", listings.map(l => l.id));
      if (!apps?.length) return [];

      // Get background checks
      const { data: bgChecks } = await supabase
        .from("background_checks")
        .select("*")
        .in("application_id", apps.map(a => a.id))
        .order("created_at", { ascending: false });
      if (!bgChecks?.length) return [];

      // Get profiles
      const applicantIds = [...new Set(apps.map(a => a.applicant_id))];
      const { data: profiles } = await supabase.from("profiles_public" as any).select("id, first_name, last_name").in("id", applicantIds) as { data: { id: string; first_name: string | null; last_name: string | null }[] | null };
      const pm = Object.fromEntries((profiles || []).map((p: any) => [p.id, p]));
      const appMap = Object.fromEntries(apps.map(a => [a.id, a]));
      const lm = Object.fromEntries(listings.map(l => [l.id, l]));

      return bgChecks.map((bc: any) => {
        const app = appMap[bc.application_id];
        const profile = app ? pm[app.applicant_id] : null;
        const listing = app ? lm[app.listing_id] : null;
        return {
          ...bc,
          applicant_name: profile ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") : "Unknown",
          listing_label: listing?.headline || listing?.address || "Listing",
        };
      });
    },
  });

  const statusConfig = (status: string) => {
    if (status === "verified") return { label: "Verified & Approved", variant: "emerald" as const, icon: CheckCircle2 };
    if (status === "declined") return { label: "Declined", variant: "destructive" as const, icon: AlertTriangle };
    if (status === "needs_info") return { label: "Needs More Info", variant: "secondary" as const, icon: Clock };
    return { label: "In Progress", variant: "secondary" as const, icon: Clock };
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Background Checks</h1>
        <p className="text-sm text-muted-foreground mt-1">All background check records for Boston Brokerage Group applicants</p>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Loading...</p>
      ) : checks.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShieldCheck className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
            <p>No background checks yet.</p>
            <p className="text-xs mt-1">Run background checks from the Applications page.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {checks.map((bc: any) => {
            const cs = statusConfig(bc.status);
            return (
              <Card key={bc.id} className="shadow-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
                      <User className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{bc.applicant_name}</p>
                      <p className="text-xs text-muted-foreground">{bc.listing_label} · {bc.created_at ? format(new Date(bc.created_at), "MMM d, yyyy") : ""}</p>
                    </div>
                    <Badge variant={cs.variant as any} className="gap-1 text-xs">
                      <cs.icon className="h-3 w-3" />{cs.label}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground pl-14">
                    <span className={`flex items-center gap-1 ${bc.identity_verified ? "text-emerald" : ""}`}>
                      <Fingerprint className="h-3 w-3" /> ID {bc.identity_verified ? "✓" : "✗"}
                    </span>
                    <span className={`flex items-center gap-1 ${bc.rental_history_verified ? "text-emerald" : ""}`}>
                      <Home className="h-3 w-3" /> Rental {bc.rental_history_verified ? "✓" : "✗"}
                    </span>
                    <span className={`flex items-center gap-1 ${bc.employment_verified ? "text-emerald" : ""}`}>
                      <Briefcase className="h-3 w-3" /> Employment {bc.employment_verified ? "✓" : "✗"}
                    </span>
                  </div>
                  {bc.notes && (
                    <p className="text-xs text-muted-foreground pl-14 italic">"{bc.notes}"</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManagerBackgroundChecks;
