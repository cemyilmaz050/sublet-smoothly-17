import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, FileText, ArrowRight, CheckCircle2, Upload, ClipboardCheck, Building2, Search, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const LandingPage = () => {
  const { user, isReady } = useAuth();

  if (isReady && user) {
    return <Navigate to="/listings" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* How It Works */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">How It Works</h1>
            <p className="mt-3 text-muted-foreground text-lg">Three simple steps to a hassle-free sublet</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              { step: "01", icon: Upload, title: "List Your Space", desc: "Upload your documents and create a detailed listing for your apartment." },
              { step: "02", icon: ShieldCheck, title: "Get Approved", desc: "Your property manager reviews and approves the sublet request." },
              { step: "03", icon: Users, title: "Close the Deal", desc: "Sign the digital agreement and welcome your verified subtenant." },
            ].map((item) => (
              <div key={item.step} className="relative rounded-2xl border bg-card p-8 text-center shadow-card hover:shadow-elevated transition-shadow">
                <span className="absolute top-4 right-5 text-sm font-medium text-muted-foreground/50">{item.step}</span>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <section className="py-20 bg-card border-t">
        <div className="container mx-auto px-6">
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              { icon: ShieldCheck, title: "Manager Approved", description: "Every listing needs your property manager's approval before going live." },
              { icon: UserCheck, title: "Verified Subtenants", description: "ID verification, background consent, and application review for every subtenant." },
              { icon: FileText, title: "Digital Contracts", description: "Auto-generated sublet applications and guaranty of lease with e-signatures." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border bg-card p-8 shadow-card">
                <item.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary">
        <div className="container mx-auto text-center px-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-4 text-white/80 text-lg max-w-md mx-auto">
            Join thousands of tenants and subtenants using SubIn.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="outline" className="mt-8 border-2 border-white text-white hover:bg-white/10 rounded-full px-10 h-12 text-base font-semibold bg-transparent">
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-white/70 text-sm">
            {["Free to list", "No hidden fees", "Cancel anytime"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
