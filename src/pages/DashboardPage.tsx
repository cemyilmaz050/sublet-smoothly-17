import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, Building2, ArrowRight } from "lucide-react";

const DashboardPage = () => {
  const dashboards = [
    { id: "tenant", label: "Tenant", icon: Home, href: "/dashboard/tenant", description: "Manage your sublet listing, upload documents, and review applicants." },
    { id: "subtenant", label: "Subtenant", icon: Search, href: "/dashboard/subtenant", description: "Track your applications, saved listings, and verification status." },
    { id: "manager", label: "Manager", icon: Building2, href: "/dashboard/manager", description: "Review sublet requests, approve documents, and manage properties." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mb-8 text-muted-foreground">Select your role to view the relevant dashboard</p>
        <div className="grid gap-4 md:grid-cols-3">
          {dashboards.map((d) => (
            <Link key={d.id} to={d.href}>
              <div className="group rounded-xl border bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:border-primary">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                  <d.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{d.label} Dashboard</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d.description}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
                  Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
