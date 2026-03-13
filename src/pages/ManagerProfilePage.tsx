import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, CheckCircle, Mail, Phone, Globe, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ManagerProfilePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [manager, setManager] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: mgr } = await supabase
        .from("property_managers")
        .select("*")
        .eq("slug", slug)
        .single();

      if (mgr) {
        setManager(mgr);
        const { data: props } = await supabase
          .from("catalog_properties")
          .select("*")
          .eq("manager_id", mgr.id);
        setProperties(props || []);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container py-8 space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </>
    );
  }

  if (!manager) {
    return (
      <>
        <Navbar />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Management group not found</h1>
          <p className="mt-2 text-muted-foreground">The management group you're looking for doesn't exist.</p>
        </div>
      </>
    );
  }

  const memberYear = new Date(manager.created_at).getFullYear();
  const initials = manager.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        {/* Cover photo */}
        <div className="relative h-48 sm:h-64 bg-gradient-to-br from-primary/20 via-accent to-primary/10 overflow-hidden">
          {manager.cover_photo_url ? (
            <img src={manager.cover_photo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Building2 className="h-32 w-32 text-primary" />
            </div>
          )}
          {/* Logo overlay */}
          <div className="absolute -bottom-10 left-6 sm:left-10 flex h-20 w-20 items-center justify-center rounded-xl border-4 border-background bg-card shadow-elevated">
            {manager.logo_url ? (
              <img src={manager.logo_url} alt={manager.name} className="h-full w-full rounded-lg object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary">{initials}</span>
            )}
          </div>
        </div>

        <div className="container pt-14 pb-16 space-y-8">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{manager.name}</h1>
              {manager.verified && (
                <Badge className="bg-emerald/10 text-emerald border-emerald/20 gap-1">
                  <CheckCircle className="h-3 w-3" /> Verified
                </Badge>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {manager.city}{manager.state ? `, ${manager.state}` : ""}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{manager.properties_count || 0} Properties</span>
              <span>·</span>
              <span>0 Active Sublets</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Member since {memberYear}</span>
            </div>
          </div>

          {/* About */}
          {manager.description && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{manager.description}</p>
            </div>
          )}

          {/* Properties */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Properties</h2>
            {properties.length === 0 ? (
              <div className="rounded-xl border bg-card p-8 text-center">
                <Building2 className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No properties listed yet</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((prop) => (
                  <div key={prop.id} className="rounded-xl border bg-card overflow-hidden shadow-card hover:shadow-elevated transition-shadow">
                    <div className="h-36 bg-gradient-to-br from-muted to-accent/50 flex items-center justify-center">
                      {prop.photo_url ? (
                        <img src={prop.photo_url} alt={prop.name} className="h-full w-full object-cover" />
                      ) : (
                        <Building2 className="h-10 w-10 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="font-semibold text-foreground">{prop.name || prop.address}</p>
                      <p className="text-xs text-muted-foreground">{prop.address}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="secondary" className="text-xs">{prop.property_type}</Badge>
                        <span className="text-xs text-muted-foreground">{prop.units_count || 0} units</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Contact</h2>
            <div className="rounded-xl border bg-card p-5 space-y-3">
              {manager.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{manager.email}</span>
                </div>
              )}
              {manager.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{manager.phone}</span>
                </div>
              )}
              {manager.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={manager.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{manager.website}</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ManagerProfilePage;
