import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, FileCheck, ArrowRight, Upload, CheckCircle2, ClipboardCheck, Home, Send, CreditCard, Building2, Search, UserCheck, FileText, KeyRound } from "lucide-react";
import heroImage from "@/assets/hero-apartment.jpg";
import { useAuth } from "@/hooks/useAuth";

const HomePage = () => {
  const { user, isReady } = useAuth();

  if (isReady && user) {
    return <Navigate to="/listings" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — full screen with real photo */}
      <section className="relative flex min-h-[90vh] items-center">
        <img
          src={heroImage}
          alt="Boston apartment"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 w-full px-6 sm:px-12 lg:px-20 py-20">
          <div className="max-w-xl">
            <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
              Sublet your apartment the right way
            </h1>
            <p className="mt-4 text-lg text-white/80">
              The trusted platform for tenants, subtenants, and property managers
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/signup?role=tenant">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-8 py-6 text-base font-semibold">
                  I am a tenant
                </Button>
              </Link>
              <Link to="/listings">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 rounded-lg px-8 py-6 text-base font-semibold">
                  I am looking for a place
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals bar */}
      <section className="border-b bg-card">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 py-6 px-6">
          {[
            { icon: ShieldCheck, label: "Manager Approved Listings" },
            { icon: UserCheck, label: "Verified Subtenants" },
            { icon: FileText, label: "Digital Contracts" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <item.icon className="h-5 w-5 text-primary" />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* How It Works — Tenants */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground text-center">How It Works</h2>
          <p className="mt-3 text-center text-muted-foreground">Simple steps for tenants and property managers</p>

          <div className="mt-16">
            <h3 className="text-xl font-semibold text-foreground mb-8">For Tenants</h3>
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
                  <h4 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h4>
                  <p className="mt-2 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16">
            <h3 className="text-xl font-semibold text-foreground mb-8">For Property Managers</h3>
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
                  <h4 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h4>
                  <p className="mt-2 text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-card py-20">
        <div className="container mx-auto text-center px-6">
          <h2 className="text-3xl font-bold text-foreground">Ready to get started?</h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Join the trusted platform for Boston sublets. Create your account in under a minute.
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

export default HomePage;
