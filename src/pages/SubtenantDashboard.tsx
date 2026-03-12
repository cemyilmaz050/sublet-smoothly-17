import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, FileCheck, MessageSquare, Clock, Search, MapPin, Calendar, DollarSign, CreditCard, ShieldCheck, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import DocumentReviewStatusCard from "@/components/DocumentReviewStatusCard";
import StepProgress from "@/components/StepProgress";
import EmptyState from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import PaymentStatusBadge from "@/components/PaymentStatusBadge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const SubtenantDashboard = () => {
  const { documentsStatus, onboardingComplete } = useAuth();
  const navigate = useNavigate();
  const isApproved = documentsStatus === "approved";
  const isPendingReview = documentsStatus === "pending_review";
  const needsVerification = !onboardingComplete;
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
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

        {/* Document Review Status for subtenants */}
        <DocumentReviewStatusCard />

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Verification", value: "Complete", icon: FileCheck, color: "text-emerald" },
            { label: "Applications", value: "2", icon: Clock, color: "text-primary" },
            { label: "Saved Listings", value: "7", icon: Heart, color: "text-destructive" },
            { label: "Next Payment", value: "$2,650", icon: CreditCard, color: "text-cyan" },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8 shadow-card">
          <CardContent className="py-8">
            <StepProgress steps={["Verify Identity", "Browse Listings", "Apply", "Get Matched"]} currentStep={2} />
          </CardContent>
        </Card>

        <Tabs defaultValue="applications">
          <TabsList className="mb-6">
            <TabsTrigger value="applications">My Applications</TabsTrigger>
            <TabsTrigger value="saved">Saved Listings</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="applications">
            <div className="space-y-4">
              {[
                { title: "Sunny 2BR in Downtown", location: "Manhattan, NY", status: "Under Review", date: "Applied Jun 28" },
                { title: "Cozy Studio near Park", location: "Brooklyn, NY", status: "Submitted", date: "Applied Jul 1" },
              ].map((app) => (
                <Card key={app.title} className="shadow-card">
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <h3 className="font-semibold text-foreground">{app.title}</h3>
                      <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {app.location}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" /> {app.date}
                      </p>
                    </div>
                    <Badge variant="pending">{app.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <EmptyState icon={Heart} title="No saved listings yet" description="Browse available listings and save the ones you're interested in." actionLabel="Browse Listings" onAction={() => {}} />
          </TabsContent>

          <TabsContent value="payments">
            <div className="space-y-4">
              {/* Upcoming */}
              <Card className="border-primary/20 shadow-card">
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Next Payment — April 1, 2026</p>
                      <p className="text-xl font-bold text-foreground">$2,650.00</p>
                    </div>
                  </div>
                  <Link to="/payments/summary">
                    <Button>
                      <DollarSign className="mr-1 h-4 w-4" /> Pay Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Recent */}
              {[
                { desc: "Monthly Rent — March", amount: "$2,650.00", status: "paid" as const },
                { desc: "Security Deposit", amount: "$2,500.00", status: "deposit_held" as const },
              ].map((p, i) => (
                <Card key={i} className="shadow-card">
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-medium text-foreground">{p.desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">{p.amount}</span>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Link to="/payments">
                <Button variant="outline" className="w-full">View All Payments</Button>
              </Link>
            </div>
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
