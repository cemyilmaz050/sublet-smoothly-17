import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2, XCircle, MapPin, DollarSign, Calendar, User, Home, Shield, Loader2, Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "@/components/EmptyState";
import { toast } from "sonner";
import { format } from "date-fns";

const ManagerApprovals = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const { data: pendingListings = [], isLoading } = useQuery({
    queryKey: ["manager-pending-approvals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("manager_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (!data?.length) return [];

      const tenantIds = [...new Set(data.map(l => l.tenant_id))];
      const { data: profiles } = await supabase
        .from("profiles_public" as any)
        .select("id, first_name, last_name, avatar_url")
        .in("id", tenantIds) as { data: { id: string; first_name: string | null; last_name: string | null; avatar_url: string | null }[] | null };
      const pm = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      // Check id_verified for each tenant via profiles (own profile only works for self, so we use profiles_public)
      return data.map(l => ({
        ...l,
        tenant_name: [pm[l.tenant_id]?.first_name, pm[l.tenant_id]?.last_name].filter(Boolean).join(" ") || "Unknown Tenant",
        tenant_avatar: pm[l.tenant_id]?.avatar_url,
      }));
    },
  });

  const handleApprove = async (listing: any) => {
    setProcessing(listing.id);
    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: "active" as any, published_at: new Date().toISOString() })
        .eq("id", listing.id);
      if (error) throw error;

      // Notify tenant
      await supabase.from("notifications").insert({
        user_id: listing.tenant_id,
        title: "Your listing has been approved!",
        message: `Your listing at ${listing.address} has been approved and is now live on SubIn!`,
        type: "approval",
        link: `/listings?id=${listing.id}`,
      });

      // Send approval email to tenant
      supabase.functions.invoke("send-notification-email", {
        body: {
          to_user_id: listing.tenant_id,
          subject: "Your listing has been approved and is now live on SubIn",
          type: "listing_approved",
          data: {
            listing_title: listing.headline,
            address: listing.address,
            action_url: `${window.location.origin}/listings?id=${listing.id}`,
          },
        },
      }).catch(() => {});

      queryClient.invalidateQueries({ queryKey: ["manager-pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["manager-home-stats"] });
      queryClient.invalidateQueries({ queryKey: ["manager-listings"] });
      toast.success("Listing approved and now live on SubIn");
    } catch (err: any) {
      toast.error(err.message || "Failed to approve listing");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setProcessing(rejectTarget.id);
    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: "rejected" as any })
        .eq("id", rejectTarget.id);
      if (error) throw error;

      // Notify tenant
      await supabase.from("notifications").insert({
        user_id: rejectTarget.tenant_id,
        title: "Your listing needs some changes",
        message: `Your listing at ${rejectTarget.address} needs changes before it can go live. Reason: ${rejectReason || "No reason provided."}`,
        type: "rejection",
        link: `/listings/edit/${rejectTarget.id}`,
      });

      // Send rejection email
      supabase.functions.invoke("send-notification-email", {
        body: {
          to_user_id: rejectTarget.tenant_id,
          subject: "Your listing needs some changes before it can go live",
          type: "listing_rejected",
          data: {
            listing_title: rejectTarget.headline,
            address: rejectTarget.address,
            reason: rejectReason || "No reason provided.",
            action_url: `${window.location.origin}/listings/edit/${rejectTarget.id}`,
          },
        },
      }).catch(() => {});

      queryClient.invalidateQueries({ queryKey: ["manager-pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["manager-home-stats"] });
      toast.success("Listing rejected. The tenant has been notified.");
      setRejectTarget(null);
      setRejectReason("");
    } catch (err: any) {
      toast.error(err.message || "Failed to reject listing");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Pending Approvals</h1>
          {pendingListings.length > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-destructive px-2 text-xs font-bold text-destructive-foreground">
              {pendingListings.length}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">Review and approve tenant listings before they go live</p>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Loading pending listings...</p>
      ) : pendingListings.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All caught up!"
          description="No listings waiting for approval right now."
        />
      ) : (
        <div className="space-y-4">
          {pendingListings.map((listing: any) => (
            <Card key={listing.id} className="shadow-card overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                {/* Photo */}
                <div className="relative h-48 w-full lg:h-auto lg:w-72 shrink-0 bg-accent">
                  {listing.photos?.[0] ? (
                    <img src={listing.photos[0]} alt={listing.headline || ""} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Home className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}
                  <Badge className="absolute left-3 top-3 bg-amber text-amber-foreground">
                    <Clock className="mr-1 h-3 w-3" /> Pending Review
                  </Badge>
                </div>

                {/* Details */}
                <CardContent className="flex-1 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{listing.headline || "Untitled"}</h3>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {listing.address || "No address"} {listing.unit_number && `(Unit ${listing.unit_number})`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-foreground">
                        ${Number(listing.monthly_rent).toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                      {listing.security_deposit && (
                        <p className="text-xs text-muted-foreground">${Number(listing.security_deposit).toLocaleString()} deposit</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> {listing.tenant_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Home className="h-3.5 w-3.5" /> {listing.bedrooms} bed, {listing.bathrooms} bath
                    </span>
                    {listing.available_from && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(listing.available_from), "MMM d")}
                        {listing.available_until && ` – ${format(new Date(listing.available_until), "MMM d, yyyy")}`}
                      </span>
                    )}
                  </div>

                  {listing.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
                  )}

                  {/* Photos preview */}
                  {listing.photos && listing.photos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {listing.photos.slice(1, 5).map((url: string, i: number) => (
                        <img key={i} src={url} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                      ))}
                      {listing.photos.length > 5 && (
                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground shrink-0">
                          +{listing.photos.length - 5}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={() => handleApprove(listing)}
                      disabled={processing === listing.id}
                      className="bg-emerald hover:bg-emerald/90 text-white"
                    >
                      {processing === listing.id ? (
                        <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Processing...</>
                      ) : (
                        <><CheckCircle2 className="mr-1 h-4 w-4" /> Approve</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setRejectTarget(listing)}
                      disabled={processing === listing.id}
                      className="border-destructive/30 text-destructive hover:bg-destructive/5"
                    >
                      <XCircle className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject listing</DialogTitle>
            <DialogDescription>
              Let the tenant know what needs to change before their listing can go live.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Photos are blurry, please upload clearer images of the apartment."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing === rejectTarget?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {processing === rejectTarget?.id ? (
                <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Rejecting...</>
              ) : (
                "Send Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerApprovals;
