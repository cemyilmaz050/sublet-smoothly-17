import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Building2, Search, MapPin, Home, LayoutGrid, List, Pause, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import EmptyState from "@/components/EmptyState";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const ManagerListings = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
      return data || [];
    },
  });

  const filtered = listings.filter((l) => {
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (l.address?.toLowerCase().includes(q) || l.headline?.toLowerCase().includes(q));
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

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Listings</h1>
          <p className="text-sm text-muted-foreground mt-1">{listings.length} total listings</p>
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
          <Input placeholder="Search listings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
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
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">Loading listings...</p>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No listings found" description="Listings synced or added will appear here." />
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((listing) => (
            <Card key={listing.id} className="overflow-hidden shadow-card transition-all hover:shadow-elevated group">
              <div className="relative h-40 bg-accent">
                {listing.photos?.[0] ? (
                  <img src={listing.photos[0]} alt={listing.headline || ""} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Home className="h-12 w-12 text-muted-foreground/20" /></div>
                )}
                <Badge variant={statusVariant(listing.status) as any} className="absolute right-3 top-3 text-xs">
                  {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                </Badge>
              </div>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-foreground truncate">{listing.headline || "Untitled"}</h3>
                <p className="flex items-center gap-1 text-sm text-muted-foreground truncate">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {listing.address || "No address"}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{listing.bedrooms || 0} bed · {listing.bathrooms || 0} bath</span>
                  {listing.monthly_rent && (
                    <span className="font-semibold text-foreground">${Number(listing.monthly_rent).toLocaleString()}/mo</span>
                  )}
                </div>
                <div className="flex gap-1.5 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="flex-1 text-xs"><Pencil className="mr-1 h-3 w-3" />Edit</Button>
                  <Button variant="outline" size="sm" className="text-xs"><Pause className="h-3 w-3" /></Button>
                  <Button variant="outline" size="sm" className="text-xs text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
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
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{listing.headline || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">{listing.address}</p>
                    </TableCell>
                    <TableCell>{listing.monthly_rent ? `$${Number(listing.monthly_rent).toLocaleString()}` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(listing.status) as any} className="text-xs">
                        {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm"><Pencil className="h-3 w-3" /></Button>
                        <Button variant="outline" size="sm"><Pause className="h-3 w-3" /></Button>
                      </div>
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
