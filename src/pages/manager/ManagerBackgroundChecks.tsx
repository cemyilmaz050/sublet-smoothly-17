import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, User, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const ManagerBackgroundChecks = () => {
  const { user } = useAuth();

  // Show all approved/declined applicants as "check" candidates
  const { data: applicants = [], isLoading } = useQuery({
    queryKey: ["mgr-bg-checks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: listings } = await supabase.from("listings").select("id, headline, address").eq("manager_id", user!.id);
      if (!listings?.length) return [];

      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .in("listing_id", listings.map(l => l.id))
        .order("created_at", { ascending: false });
      if (!apps?.length) return [];

      const ids = [...new Set(apps.map(a => a.applicant_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name").in("id", ids);
      const pm = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      const lm = Object.fromEntries(listings.map(l => [l.id, l]));

      return apps.map(a => ({
        ...a,
        name: [pm[a.applicant_id]?.first_name, pm[a.applicant_id]?.last_name].filter(Boolean).join(" ") || "Unknown",
        listing_label: lm[a.listing_id]?.headline || lm[a.listing_id]?.address || "Listing",
      }));
    },
  });

  // Placeholder check status based on application status
  const checkStatus = (status: string | null) => {
    if (status === "approved") return { label: "Clear", variant: "emerald" as const, icon: CheckCircle2 };
    if (status === "declined") return { label: "Flagged", variant: "destructive" as const, icon: AlertTriangle };
    return { label: "Pending", variant: "secondary" as const, icon: Clock };
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Background Checks</h1>
        <p className="text-sm text-muted-foreground mt-1">Review verification status for all applicants</p>
      </div>

      <Card className="shadow-card border-dashed border-2 border-amber/40 bg-amber/[0.03]">
        <CardContent className="flex items-start gap-3 p-4">
          <ShieldCheck className="h-5 w-5 text-amber mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Automated Background Checks Coming Soon</p>
            <p className="text-xs text-muted-foreground mt-0.5">For now, you can manually mark applicants as verified after your own review process.</p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Loading...</p>
      ) : applicants.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShieldCheck className="mx-auto mb-2 h-10 w-10 text-muted-foreground/30" />
            No applicants to review yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applicants.map((a: any) => {
            const cs = checkStatus(a.status);
            return (
              <Card key={a.id} className="shadow-card">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent">
                    <User className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.listing_label} · {a.created_at ? format(new Date(a.created_at), "MMM d, yyyy") : ""}</p>
                  </div>
                  <Badge variant={cs.variant as any} className="gap-1 text-xs">
                    <cs.icon className="h-3 w-3" />{cs.label}
                  </Badge>
                  <Button variant="outline" size="sm" className="text-xs shrink-0">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Mark Verified
                  </Button>
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
