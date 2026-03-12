import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle2, Clock, AlertTriangle, Eye, MessageSquare, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";

const ManagerDashboard = () => {
  const pendingRequests = [
    { tenant: "Sarah Johnson", unit: "Apt 4B", submitted: "Jun 25, 2026", documents: 4, status: "pending" as const },
    { tenant: "Mike Chen", unit: "Apt 7A", submitted: "Jun 28, 2026", documents: 3, status: "pending" as const },
    { tenant: "Emily Davis", unit: "Apt 2C", submitted: "Jul 1, 2026", documents: 4, status: "pending" as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Property Manager Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Review and manage sublet requests</p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Pending Reviews", value: "3", icon: Clock, color: "text-amber" },
            { label: "Approved Sublets", value: "12", icon: CheckCircle2, color: "text-emerald" },
            { label: "Flagged Documents", value: "1", icon: AlertTriangle, color: "text-destructive" },
            { label: "Messages", value: "4", icon: MessageSquare, color: "text-primary" },
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

        <Tabs defaultValue="pending">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending Reviews</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="flagged">Flagged</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <Card key={req.tenant} className="shadow-card">
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground">
                        {req.tenant.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{req.tenant}</h3>
                        <p className="text-sm text-muted-foreground">{req.unit} · Submitted {req.submitted}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          {req.documents} documents attached
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Review
                      </Button>
                      <Button variant="emerald" size="sm">
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="approved">
            <EmptyState
              icon={CheckCircle2}
              title="View approved sublets"
              description="All approved sublet requests will appear here for your records."
            />
          </TabsContent>

          <TabsContent value="flagged">
            <EmptyState
              icon={AlertTriangle}
              title="No flagged documents"
              description="Documents that need attention or revision will appear here."
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManagerDashboard;
