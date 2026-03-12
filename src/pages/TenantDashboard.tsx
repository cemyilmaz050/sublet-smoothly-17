import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, MessageSquare, Eye, Upload, CheckCircle2, Clock, ArrowRight, Plus } from "lucide-react";
import Navbar from "@/components/Navbar";
import DocumentUpload from "@/components/DocumentUpload";
import StepProgress from "@/components/StepProgress";
import EmptyState from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TenantDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tenant Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Manage your sublet listing and applications</p>
          </div>
          <Button size="lg">
            <Plus className="mr-1 h-4 w-4" />
            Create Listing
          </Button>
        </div>

        {/* Status Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Listing Status", value: "Under Review", icon: Clock, variant: "pending" as const },
            { label: "Documents", value: "3 of 4", icon: FileText, variant: "amber" as const },
            { label: "Applicants", value: "5", icon: Users, variant: "cyan" as const },
            { label: "Messages", value: "2 new", icon: MessageSquare, variant: "secondary" as const },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <stat.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <Badge variant={stat.variant} className="text-[10px]">{stat.variant === "pending" ? "Pending" : ""}</Badge>
                  </div>
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

        <Tabs defaultValue="documents">
          <TabsList className="mb-6">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="applicants">Applicants</TabsTrigger>
            <TabsTrigger value="listing">Listing</TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <div className="space-y-4">
              <DocumentUpload
                label="Lease Agreement"
                description="Upload your current lease agreement (PDF)"
                status="approved"
                fileName="lease_agreement_2026.pdf"
              />
              <DocumentUpload
                label="Proof of Residence"
                description="Utility bill or bank statement"
                status="approved"
                fileName="utility_bill_june.pdf"
              />
              <DocumentUpload
                label="Sublet Request Letter"
                description="Formal request to your property manager"
                status="pending"
                fileName="sublet_request.pdf"
              />
              <DocumentUpload
                label="Additional Documents"
                description="Any other supporting documents"
                status="empty"
              />
            </div>
          </TabsContent>

          <TabsContent value="applicants">
            <EmptyState
              icon={Users}
              title="No applicants yet"
              description="Once your listing goes live, applicants will appear here. You'll be able to review their profiles and documents."
            />
          </TabsContent>

          <TabsContent value="listing">
            <EmptyState
              icon={Eye}
              title="Listing not yet created"
              description="Complete your document uploads and get manager approval to create your listing."
              actionLabel="Upload Documents"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TenantDashboard;
