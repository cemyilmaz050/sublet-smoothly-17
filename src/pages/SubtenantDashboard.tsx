import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Search, MapPin, Calendar, ShieldCheck, Clock, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import ProfileCompleteness from "@/components/ProfileCompleteness";
import DocumentReviewStatusCard from "@/components/DocumentReviewStatusCard";
import EmptyState from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Application {
  id: string;
  status: string | null;
  created_at: string | null;
  listing: {
    headline: string | null;
    address: string | null;
  } | null;
}

interface SavedListing {
  id: string;
  listing_id: string;
  listing: {
    headline: string | null;
    address: string | null;
    monthly_rent: number | null;
    photos: string[] | null;
  } | null;
}

const SubtenantDashboard = () => {
  const { user, documentsStatus, onboardingComplete } = useAuth();
  const navigate = useNavigate();
  const isPendingReview = documentsStatus === "pending_review";
  const needsVerification = !onboardingComplete;

  const [applications, setApplications] = useState<Application[]>([]);
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [appsRes, savedRes] = await Promise.all([
        supabase
          .from("applications")
          .select("id, status, created_at, listing:listings(headline, address)")
          .eq("applicant_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("saved_listings")
          .select("id, listing_id, listing:listings(headline, address, monthly_rent, photos)")
          .eq("user_id", user.id)
          .order("saved_at", { ascending: false }),
      ]);
      setApplications((appsRes.data as any) || []);
      setSavedListings((savedRes.data as any) || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const removeSaved = async (id: string) => {
    await supabase.from("saved_listings").delete().eq("id", id);
    setSavedListings((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-8 space-y-6">
        {/* Profile Completeness */}
        <ProfileCompleteness />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Subtenant Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Track your applications and find your next home</p>
          </div>
          {needsVerification ? (
            <Button size="lg" onClick={() => navigate("/subtenant/onboarding")}>
              <ShieldCheck className="mr-1 h-4 w-4" />
              Get Verified to Apply
            </Button>
          ) : isPendingReview ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="lg" disabled>
                  <Clock className="mr-1 h-4 w-4" />
                  Verification In Progress
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Your documents are under review. You'll be able to apply once verified.</p>
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>

        <DocumentReviewStatusCard />

        <Tabs defaultValue="applications" className="mt-6">
          <TabsList className="mb-6">
            <TabsTrigger value="applications">
              My Applications{applications.length > 0 && ` (${applications.length})`}
            </TabsTrigger>
            <TabsTrigger value="saved">
              Saved{savedListings.length > 0 && ` (${savedListings.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
              </div>
            ) : applications.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No applications yet"
                description="Browse listings and apply to the ones you like."
                actionLabel="Browse Listings"
                onAction={() => navigate("/listings")}
              />
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <Card key={app.id} className="shadow-sm">
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <h3 className="font-semibold text-foreground">{app.listing?.headline || "Untitled"}</h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {app.listing?.address || "Unknown"}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" /> Applied {formatDate(app.created_at)}
                        </p>
                      </div>
                      <Badge variant="pending" className="capitalize">{app.status || "pending"}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
              </div>
            ) : savedListings.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No saved listings yet"
                description="Browse available listings and save the ones you're interested in."
                actionLabel="Browse Listings"
                onAction={() => navigate("/listings")}
              />
            ) : (
              <div className="space-y-3">
                {savedListings.map((saved) => (
                  <Card key={saved.id} className="shadow-sm">
                    <CardContent className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4">
                        {saved.listing?.photos?.[0] ? (
                          <img src={saved.listing.photos[0]} alt="" className="h-14 w-14 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">No img</div>
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground">{saved.listing?.headline || "Untitled"}</h3>
                          <p className="mt-0.5 text-sm text-muted-foreground">{saved.listing?.address || "Unknown"}</p>
                          {saved.listing?.monthly_rent && (
                            <p className="mt-0.5 text-sm font-bold text-primary">${saved.listing.monthly_rent.toLocaleString()}/mo</p>
                          )}
                        </div>
                      </div>
                      <button onClick={() => removeSaved(saved.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Heart className="h-5 w-5 fill-primary text-primary" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Link to="/listings">
            <Button variant="outline" size="lg">
              <Search className="mr-1 h-4 w-4" /> Browse All Listings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubtenantDashboard;
