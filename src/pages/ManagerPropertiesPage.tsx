import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2, Search, ArrowLeft, MapPin, Home, LayoutGrid, List, Plus
} from "lucide-react";

import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import EmptyState from "@/components/EmptyState";

const ManagerPropertiesPage = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["manager-properties", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("manager_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = listings.filter((l) => {
    if (filterType !== "all" && l.property_type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (l.address?.toLowerCase().includes(q) || l.headline?.toLowerCase().includes(q));
    }
    return true;
  });

  const statusVariant = (status: string) => {
    switch (status) {
      case "active": return "emerald";
      case "pending": return "pending";
      case "expired": return "secondary";
      case "rejected": return "rejected";
      default: return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link to="/dashboard/manager">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Properties</h1>
            <p className="text-sm text-muted-foreground">Manage your property portfolio</p>
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
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search properties..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Property type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="condo">Condo</SelectItem>
              <SelectItem value="studio">Studio</SelectItem>
              <SelectItem value="house">House</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="py-12 text-center text-muted-foreground">Loading properties...</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description="Properties synced from AppFolio or added by tenants will appear here."
          />
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => (
              <Card key={listing.id} className="overflow-hidden shadow-card transition-all hover:shadow-elevated">
                <div className="relative h-40 bg-accent">
                  {listing.photos && listing.photos[0] ? (
                    <img src={listing.photos[0]} alt={listing.headline || "Property"} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Home className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <Badge variant={statusVariant(listing.status) as any} className="absolute right-3 top-3">
                    {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                  </Badge>
                  {listing.source === "appfolio" && (
                    <Badge variant="cyan" className="absolute left-3 top-3">AppFolio</Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground">{listing.headline || "Untitled Property"}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {listing.address || "No address"}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {listing.bedrooms || 0} bed · {listing.bathrooms || 0} bath
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
                    <TableHead>Type</TableHead>
                    <TableHead>Beds/Baths</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{listing.headline || "Untitled"}</p>
                          <p className="text-sm text-muted-foreground">{listing.address}</p>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{listing.property_type || "—"}</TableCell>
                      <TableCell>{listing.bedrooms || 0} / {listing.bathrooms || 0}</TableCell>
                      <TableCell>{listing.monthly_rent ? `$${Number(listing.monthly_rent).toLocaleString()}` : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(listing.status) as any}>
                          {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {listing.source === "appfolio" ? <Badge variant="cyan">AppFolio</Badge> : <Badge variant="secondary">Manual</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ManagerPropertiesPage;
