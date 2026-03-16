import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Building2, MapPin, Home, Pencil, Plus, CheckCircle2, Clock, AlertCircle, Trash2, Loader2, Eye, EyeOff,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import EmptyState from "@/components/EmptyState";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const BBG_PM_ID = "d39b883c-0941-4620-96d6-ea588231b58e";

const ManagerCatalog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["manager-catalog", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: props } = await supabase
        .from("catalog_properties")
        .select("*")
        .eq("manager_id", BBG_PM_ID)
        .order("address", { ascending: true });
      if (!props?.length) return [];

      const { data: listings } = await supabase
        .from("listings")
        .select("id, address, status, headline, management_group_id, monthly_rent, photos")
        .eq("management_group_id", BBG_PM_ID);

      const listingsByAddress = new Map<string, any[]>();
      (listings || []).forEach((l) => {
        const addr = l.address || "";
        if (!listingsByAddress.has(addr)) listingsByAddress.set(addr, []);
        listingsByAddress.get(addr)!.push(l);
      });

      return props.map((p) => {
        const relatedListings = listingsByAddress.get(p.address) || [];
        const activeListings = relatedListings.filter((l) => l.status === "active");
        const draftListings = relatedListings.filter((l) => l.status === "draft");
        const pendingListings = relatedListings.filter((l) => l.status === "pending");
        return {
          ...p,
          listings: relatedListings,
          activeCount: activeListings.length,
          draftCount: draftListings.length,
          pendingCount: pendingListings.length,
          totalListings: relatedListings.length,
        };
      });
    },
  });

  const handleDelete = async (prop: any) => {
    setDeleting(prop.id);
    try {
      // Delete associated catalog units first
      const { error: unitsError } = await supabase.from("catalog_units").delete().eq("property_id", prop.id);
      if (unitsError) throw unitsError;

      // Hard-delete associated listings managed by this user
      for (const listing of prop.listings) {
        const { error: listingError } = await supabase.from("listings").delete().eq("id", listing.id);
        if (listingError) {
          // Fallback to soft-delete if hard delete fails
          await supabase.from("listings").update({ status: "deleted" as any }).eq("id", listing.id);
        }
      }

      // Delete the catalog property
      const { error: propError } = await supabase.from("catalog_properties").delete().eq("id", prop.id);
      if (propError) throw propError;

      queryClient.invalidateQueries({ queryKey: ["manager-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["manager-listings"] });
      toast.success("Listing deleted successfully");
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete property. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (prop: any) => {
    const activeListing = prop.listings.find((l: any) => l.status === "active");
    const draftListing = prop.listings.find((l: any) => l.status === "draft");
    const targetListing = activeListing || draftListing || prop.listings[0];

    if (!targetListing) {
      toast.error("No listing exists for this property. Use Edit to create one.");
      return;
    }

    setToggling(prop.id);
    const newStatus = targetListing.status === "active" ? "draft" : "active";
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === "active") {
        updateData.published_at = new Date().toISOString();
      }
      const { error } = await supabase.from("listings").update(updateData).eq("id", targetListing.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["manager-catalog"] });
      queryClient.invalidateQueries({ queryKey: ["manager-listings"] });
      toast.success(newStatus === "active" ? "Listing is now live — everyone can see it" : "Listing moved to draft — hidden from public");
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setToggling(null);
    }
  };

  const getStatusBadge = (prop: any) => {
    if (prop.activeCount > 0) return <Badge variant="emerald" className="text-xs"><CheckCircle2 className="mr-1 h-3 w-3" />Live (Subletter Active)</Badge>;
    if (prop.pendingCount > 0) return <Badge variant="pending" className="text-xs"><Clock className="mr-1 h-3 w-3" />Pending Approval</Badge>;
    if (prop.totalListings > 0) return <Badge variant="secondary" className="text-xs"><EyeOff className="mr-1 h-3 w-3" />Draft Listing</Badge>;
    return <Badge variant="outline" className="text-xs"><CheckCircle2 className="mr-1 h-3 w-3" />In Catalog</Badge>;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mb-2">
        <p className="text-sm text-foreground font-medium">📋 Property Catalog — these properties are available for subletters to choose from. They will only appear publicly on SubIn when a subletter creates a listing for them.</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
         <h1 className="text-2xl font-bold text-foreground">Property Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add and manage your properties here. Subletters will choose from this catalog when listing their apartments.
          </p>
        </div>
        <Button onClick={() => navigate("/portal-mgmt-bbg/catalog/new")} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add New Property
        </Button>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Loading properties...</p>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties in catalog"
          description="Click 'Add New Property' to get started."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((prop: any) => (
            <Card key={prop.id} className="shadow-card overflow-hidden transition-all hover:shadow-elevated group">
              <div className="relative h-36 bg-accent flex items-center justify-center">
                {prop.photo_url ? (
                  <img src={prop.photo_url} alt={prop.address} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground/30">
                    <Home className="h-10 w-10" />
                    <span className="text-xs">No photos yet</span>
                  </div>
                )}
                <div className="absolute right-3 top-3">{getStatusBadge(prop)}</div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground">{prop.name || prop.address}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {prop.address}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{prop.property_type || "Apartment"}</p>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{prop.totalListings} listing{prop.totalListings !== 1 ? "s" : ""}</span>
                  {prop.units_count > 0 && <span>• {prop.units_count} unit{prop.units_count !== 1 ? "s" : ""}</span>}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/portal-mgmt-bbg/catalog/${prop.id}`)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>


                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2">
                        {deleting === prop.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this listing?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This cannot be undone. The property <strong>{prop.address}</strong> will be permanently removed from the catalog
                          {prop.totalListings > 0 && ` along with ${prop.totalListings} associated listing${prop.totalListings > 1 ? "s" : ""}`}.
                          It will no longer appear on the public listings page or map.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDelete(prop)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerCatalog;
