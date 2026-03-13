import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Building2, Search, MapPin, Home, LayoutGrid, List, Pencil, Calendar, User, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import EmptyState from "@/components/EmptyState";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

const ManagerListings = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["manager-listings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("manager_id", user!.id)
        .order("created_at", { ascending: false });
      if (!data?.length) return [];

      // Fetch tenant names
      const tenantIds = [...new Set(data.map(l => l.tenant_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", tenantIds);
      const pm = Object.fromEntries((profiles || []).map(p => [p.id, p]));

      return data.map(l => ({
        ...l,
        tenant_name: [pm[l.tenant_id]?.first_name, pm[l.tenant_id]?.last_name].filter(Boolean).join(" ") || "Unknown Tenant",
      }));
    },
  });

  const filtered = listings.filter((l: any) => {
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (l.address?.toLowerCase().includes(q) || l.headline?.toLowerCase().includes(q) || l.tenant_name?.toLowerCase().includes(q));
    }
    return true;
  });

  const statusVariant = (s: string) => {
    switch (s) {
      case "active": return "emerald";
      case "pending": return "pending";
      case "expired": return "secondary";
      default: return "secondary";
    }
  };

  const statusLabel = (s: string) => {
    switch (s) {
      case "active": return "Active";
      case "pending": return "Pending";
      case "expired": return "Filled";
      case "draft": return "Draft";
      default: return s.charAt(0).toUpperCase() + s.slice(1);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Active Sublet Listings</h1>
          <p className="text-sm text-muted-foreground mt-1">Properties listed for sublet under Boston Brokerage Group management</p>
        </div>
        <div className="flex gap-2">
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="icon" onClick={() => setViewMode("grid")}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by address, headline, or tenant..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="expired">Filled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Loading listings...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No sublet listings yet" description="When tenants list properties under your management, they'll appear here." />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((listing: any) => (
            <Card key={listing.id} className="overflow-hidden shadow-card transition-all hover:shadow-elevated group">
              <div className="relative h-40 bg-accent">
                {listing.photos?.[0] ? (
                  <img src={listing.photos[0]} alt={listing.headline || ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Home className="h-12 w-12 text-muted-foreground/20" /></div>
                )}
                <Badge variant={statusVariant(listing.status) as any} className="absolute right-3 top-3 text-xs">
                  {statusLabel(listing.status)}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-foreground truncate">{listing.headline || "Untitled"}</h3>
                <p className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {listing.address || "No address"}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  Listed by {listing.tenant_name}
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {listing.created_at ? format(new Date(listing.created_at), "MMM d, yyyy") : "—"}
                  </span>
                  {listing.monthly_rent && (
                    <span className="font-semibold text-foreground">${Number(listing.monthly_rent).toLocaleString()}/mo</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Listed By</TableHead>
                  <TableHead>Date Listed</TableHead>
                  <TableHead>Asking Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((listing: any) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{listing.headline || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">{listing.address}</p>
                    </TableCell>
                    <TableCell className="text-sm">{listing.tenant_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {listing.created_at ? format(new Date(listing.created_at), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {listing.monthly_rent ? `$${Number(listing.monthly_rent).toLocaleString()}/mo` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(listing.status) as any} className="text-xs">
                        {statusLabel(listing.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManagerListings;
