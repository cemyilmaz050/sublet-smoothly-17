import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { lazy, Suspense } from "react";

// Inline the dashboard content to avoid circular imports
import TenantDashboardContent from "@/pages/TenantDashboard";
import SubtenantDashboardContent from "@/pages/SubtenantDashboard";
import ManagerDashboardContent from "@/pages/ManagerDashboard";

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-6 text-3xl font-bold text-foreground">Dashboard</h1>
        <Tabs defaultValue="tenant">
          <TabsList className="mb-6">
            <TabsTrigger value="tenant">Tenant View</TabsTrigger>
            <TabsTrigger value="subtenant">Subtenant View</TabsTrigger>
            <TabsTrigger value="manager">Manager View</TabsTrigger>
          </TabsList>
          <TabsContent value="tenant">
            <p className="mb-4 text-sm text-muted-foreground">Preview of the Tenant Dashboard</p>
            <a href="/dashboard/tenant" className="text-primary underline text-sm">Open full Tenant Dashboard →</a>
          </TabsContent>
          <TabsContent value="subtenant">
            <p className="mb-4 text-sm text-muted-foreground">Preview of the Subtenant Dashboard</p>
            <a href="/dashboard/subtenant" className="text-primary underline text-sm">Open full Subtenant Dashboard →</a>
          </TabsContent>
          <TabsContent value="manager">
            <p className="mb-4 text-sm text-muted-foreground">Preview of the Manager Dashboard</p>
            <a href="/dashboard/manager" className="text-primary underline text-sm">Open full Manager Dashboard →</a>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;
