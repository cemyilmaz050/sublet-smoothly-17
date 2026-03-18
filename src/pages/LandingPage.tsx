import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, FileCheck, ArrowRight, Upload, CheckCircle2, Home, Building2, Search, ClipboardCheck, Send, UserCheck, FileText, KeyRound, CreditCard } from "lucide-react";
import heroImage from "@/assets/hero-apartment.jpg";
import { useAuth } from "@/hooks/useAuth";

const LandingPage = () => {
  const { user, isReady } = useAuth();

  if (isReady && user) {
    return <Navigate to="/listings" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h1 className="text-3xl font-bold text-foreground text-center">How SubIn Works</h1>
          <p className="mt-3 text-center text-muted-foreground max-w-lg mx-auto">
            SubIn connects tenants, subtenants, and property managers on one trusted platform. Here's how each step works.
          </p>

          {/* Tenant flow */}
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-foreground mb-8">For Tenants</h2>
            <div className="grid gap-6 md:grid-cols-5">
              {[
                { step: "1", icon: Upload, title: "List your place", desc: "Upload photos, set your price, and describe your apartment" },
                { step: "2", icon: Send, title: "Submit for approval", desc: "Your property manager reviews and approves the listing" },
                { step: "3", icon: Search, title: "Receive applicants", desc: "Verified subtenants browse and knock on your listing" },
                { step: "4", icon: ClipboardCheck, title: "Complete documents", desc: "Digital sublet application and guaranty of lease" },
                { step: "5", icon: CheckCircle2, title: "Hand over the keys", desc: "Sign digitally, collect your deposit, and you're done" },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Manager flow */}
          <div className="mt-16">
            <h2 className="text-xl font-semibold text-foreground mb-8">For Property Managers</h2>
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { step: "1", icon: Building2, title: "Set up your portal", desc: "Add your properties and configure sublet policies" },
                { step: "2", icon: FileCheck, title: "Review sublet requests", desc: "Approve or reject tenant sublet applications" },
                { step: "3", icon: Users, title: "Vet subtenants", desc: "Review applicant documents, background info, and guarantors" },
                { step: "4", icon: CheckCircle2, title: "Approve and manage", desc: "Approve sublets, track active agreements, and maintain compliance" },
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="border-t bg-card py-20">
        <div className="container mx-auto px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Manager Approved", description: "Every listing needs your property manager's approval before going live." },
              { icon: UserCheck, title: "Verified Subtenants", description: "ID verification, background consent, and application review for every subtenant." },
              { icon: FileText, title: "Digital Contracts", description: "Auto-generated sublet applications and guaranty of lease with e-signatures." },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border bg-card p-8">
                <item.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto text-center px-6">
          <h2 className="text-3xl font-bold text-foreground">Ready to get started?</h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Create your account and start subletting the right way.
          </p>
          <Link to="/signup">
            <Button size="lg" className="mt-8 px-10 py-6 text-base font-semibold rounded-lg">
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
