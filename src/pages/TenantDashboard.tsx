import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, MessageSquare, Eye, Clock, Plus, DollarSign, TrendingUp, ArrowRight, Pencil, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import DocumentUpload from "@/components/DocumentUpload";
import StepProgress from "@/components/StepProgress";
import EmptyState from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Listing {
  id: string;
  headline: string | null;
  address: string | null;
  monthly_rent: number | null;
  photos: string[] | null;
  status: string;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "active": return "emerald" as const;
    case "pending": return "pending" as const;
    case "draft": return "secondary" as const;
    case "rejected": return "destructive" as const;
    case "expired": return "outline" as const;
    default: return "secondary" as const;
  }
};

const TenantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  // Mock: approval status (in production, this would come from a sublet_requests table)
  const [isApproved] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchListings = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, headline, address, monthly_rent, photos, status")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false });
      setListings((data as Listing[]) || []);
      setLoading(false);
    };
    fetchListings();
  }, [user]);

  const draftListing = listings.find((l) => l.status === "draft");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tenant Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Manage your sublet listing and applications</p>
          </div>
          {isApproved ? (
            <Button size="lg" onClick={() => navigate("/listings/create")}>
              <Plus className="mr-1 h-4 w-4" />
              Create Listing
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="lg" disabled>
                  <Plus className="mr-1 h-4 w-4" />
                  Create Listing
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>You need manager approval before listing your property</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Draft Banner */}
        {draftListing && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6 border-primary/30 bg-accent/50 shadow-card">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">You have an unfinished draft</p>
                    <p className="text-sm text-muted-foreground">{draftListing.headline || draftListing.address || "Untitled listing"}</p>
                  </div>
                </div>
                <Button onClick={() => navigate(`/listings/edit/${draftListing.id}`)}>
                  Continue Draft
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Status Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Listings", value: String(listings.length), icon: Eye, variant: "cyan" as const },
            { label: "Active", value: String(listings.filter((l) => l.status === "active").length), icon: FileText, variant: "emerald" as const },
            { label: "Pending Review", value: String(listings.filter((l) => l.status === "pending").length), icon: Clock, variant: "pending" as const },
            { label: "Earnings", value: "$7,050", icon: TrendingUp, variant: "emerald" as const },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <stat.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Step Progress */}
        <Card className="mb-8 shadow-card">
          <CardContent className="py-8">
            <StepProgress
              steps={["Upload Documents", "Manager Review", "Create Listing", "Find Subtenant"]}
              currentStep={1}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="listings">
          <TabsList className="mb-6">
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="applicants">Applicants</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading...</div>
            ) : listings.length === 0 ? (
              <EmptyState
                icon={Eye}
                title="No listings yet"
                description="Create your first listing to start finding a subtenant."
                actionLabel="Create Listing"
                onAction={() => navigate("/listings/create")}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden shadow-card">
                    <div className="aspect-video bg-muted">
                      {listing.photos && listing.photos.length > 0 ? (
                        <img src={listing.photos[0]} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">No photo</div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-semibold text-foreground line-clamp-1">{listing.headline || "Untitled"}</h3>
                        <Badge variant={statusVariant(listing.status)} className="capitalize text-xs">
                          {listing.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{listing.address || "No address"}</p>
                      {listing.monthly_rent && (
                        <p className="mt-1 font-semibold text-foreground">${listing.monthly_rent}/mo</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        {(listing.status === "draft" || listing.status === "rejected") && (
                          <Button size="sm" variant="outline" onClick={() => navigate(`/listings/edit/${listing.id}`)}>
                            <Pencil className="mr-1 h-3 w-3" /> Edit
                          </Button>
                        )}
                        {listing.status === "active" && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => navigate(`/listings/edit/${listing.id}`)}>
                              <Pencil className="mr-1 h-3 w-3" /> Edit
                            </Button>
                            <Button size="sm" variant="outline">
                              <Users className="mr-1 h-3 w-3" /> Applicants
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost">
                          <Eye className="mr-1 h-3 w-3" /> View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-4">
              <DocumentUpload label="Lease Agreement" description="Upload your current lease agreement (PDF)" status="approved" fileName="lease_agreement_2026.pdf" />
              <DocumentUpload label="Proof of Residence" description="Utility bill or bank statement" status="approved" fileName="utility_bill_june.pdf" />
              <DocumentUpload label="Sublet Request Letter" description="Formal request to your property manager" status="pending" fileName="sublet_request.pdf" />
              <DocumentUpload label="Additional Documents" description="Any other supporting documents" status="empty" />
            </div>
          </TabsContent>

          <TabsContent value="applicants">
            <EmptyState icon={Users} title="No applicants yet" description="Once your listing goes live, applicants will appear here." />
          </TabsContent>

          <TabsContent value="payments">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="shadow-card">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald/15">
                      <TrendingUp className="h-6 w-6 text-emerald" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earned</p>
                      <p className="text-xl font-bold text-foreground">$7,050.00</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-card">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber/15">
                      <Clock className="h-6 w-6 text-amber" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Payout</p>
                      <p className="text-xl font-bold text-foreground">$2,350.00</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex gap-3">
                <Link to="/earnings">
                  <Button>
                    <DollarSign className="mr-1 h-4 w-4" />
                    View Full Earnings
                  </Button>
                </Link>
                <Link to="/pricing-setup">
                  <Button variant="outline">Set Up Pricing</Button>
                </Link>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TenantDashboard;
