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
  Building2, MapPin, Home, Pencil, Plus, Image as ImageIcon, CheckCircle2, Clock, AlertCircle, Trash2, Loader2,
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

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["manager-catalog", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get all BBG catalog properties
      const { data: props } = await supabase
        .from("catalog_properties")
        .select("*")
        .eq("manager_id", BBG_PM_ID)
        .order("address", { ascending: true });
      if (!props?.length) return [];

      // Get listings linked to these addresses to determine status
      const { data: listings } = await supabase
        .from("listings")
        .select("id, address, status, headline, management_group_id")
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
        const pendingListings = relatedListings.filter((l) => l.status === "pending");
        return {
          ...p,
          listings: relatedListings,
          activeCount: activeListings.length,
          pendingCount: pendingListings.length,
          totalListings: relatedListings.length,
        };
      });
    },
  });

  const getStatusBadge = (prop: any) => {
    if (prop.activeCount > 0) return <Badge variant="emerald" className="text-xs"><CheckCircle2 className="mr-1 h-3 w-3" />Active</Badge>;
    if (prop.pendingCount > 0) return <Badge variant="pending" className="text-xs"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    return <Badge variant="secondary" className="text-xs"><AlertCircle className="mr-1 h-3 w-3" />No listing</Badge>;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Property Catalog</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage all Boston Brokerage Group properties — add photos, descriptions, and pricing
        </p>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Loading properties...</p>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties in catalog"
          description="Properties will appear here once added to the BBG catalog."
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
                  <h3 className="font-semibold text-foreground">{prop.address}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">{prop.property_type || "Apartment"}</p>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{prop.totalListings} listing{prop.totalListings !== 1 ? "s" : ""}</span>
                  {prop.units_count > 0 && <span>• {prop.units_count} unit{prop.units_count !== 1 ? "s" : ""}</span>}
                </div>

                {prop.totalListings === 0 && (
                  <p className="text-xs text-amber flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    No active listing — create one now
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(`/manager/catalog/${prop.id}`)}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  {prop.activeCount > 0 && prop.listings[0] && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => window.open(`/listings?id=${prop.listings.find((l: any) => l.status === "active")?.id}`, "_blank")}
                    >
                      View Live
                    </Button>
                  )}
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
