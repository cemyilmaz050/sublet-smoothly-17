import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, Eye, Clock, Plus, DollarSign, TrendingUp, ArrowRight, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import DocumentUpload from "@/components/DocumentUpload";
import StepProgress from "@/components/StepProgress";
import EmptyState from "@/components/EmptyState";
import YourListingsSection from "@/components/tenant/YourListingsSection";
import SubtenantActivitySection from "@/components/tenant/SubtenantActivitySection";
import SubletOnboardingOverlay from "@/components/SubletOnboardingOverlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  available_from: string | null;
  available_until: string | null;
  view_count: number;
  save_count: number;
}

const TenantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchListings = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, headline, address, monthly_rent, photos, status, available_from, available_until, view_count, save_count")
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
          <Button size="lg" onClick={() => navigate("/listings/create")}>
            <Plus className="mr-1 h-4 w-4" />
            Create Listing
          </Button>
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
            { label: "Total Listings", value: String(listings.length), icon: Eye },
            { label: "Active", value: String(listings.filter((l) => l.status === "active").length), icon: FileText },
            { label: "Pending Review", value: String(listings.filter((l) => l.status === "pending").length), icon: Clock },
            { label: "Earnings", value: "$7,050", icon: TrendingUp },
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

        {/* Your Listings Section */}
        <YourListingsSection
          listings={listings}
          loading={loading}
          onOpenOnboarding={() => setShowOnboarding(true)}
        />

        {/* Subtenant Activity Section */}
        <SubtenantActivitySection listings={listings} />

        {/* Tabs for Documents, Payments etc */}
        <Tabs defaultValue="documents">
          <TabsList className="mb-6">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <div className="space-y-4">
              <DocumentUpload label="Lease Agreement" description="Upload your current lease agreement (PDF)" status="approved" fileName="lease_agreement_2026.pdf" />
              <DocumentUpload label="Proof of Residence" description="Utility bill or bank statement" status="approved" fileName="utility_bill_june.pdf" />
              <DocumentUpload label="Sublet Request Letter" description="Formal request to your property manager" status="pending" fileName="sublet_request.pdf" />
              <DocumentUpload label="Additional Documents" description="Any other supporting documents" status="empty" />
            </div>
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

      {/* Onboarding Overlay */}
      {showOnboarding && (
        <SubletOnboardingOverlay onClose={() => setShowOnboarding(false)} />
      )}
    </div>
  );
};

export default TenantDashboard;
