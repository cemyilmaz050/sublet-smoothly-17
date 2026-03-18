import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, FileText, ArrowRight, CheckCircle2, Upload, ClipboardCheck } from "lucide-react";
import heroVideoAsset from "../../public/hero-process.mp4.asset.json";
import { useAuth } from "@/hooks/useAuth";

const HomePage = () => {
  const { user, isReady } = useAuth();

  if (isReady && user) {
    return <Navigate to="/listings" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero — full screen with photo background */}
      <section className="relative flex min-h-[85vh] items-center">
        <img
          src={heroImage}
          alt="Boston apartment interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        <div className="relative z-10 w-full px-8 sm:px-16 lg:px-24 py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              Sublet your apartment{" "}
              <span className="text-primary">the right way</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 leading-relaxed max-w-xl">
              The trusted platform for tenants, subtenants, and property managers to handle subletting with full transparency and approval.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/signup?role=tenant">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 h-12 text-base font-semibold shadow-lg">
                  I'm a Tenant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/listings">
                <Button size="lg" variant="outline" className="border-2 border-white/80 text-white hover:bg-white/10 rounded-full px-8 h-12 text-base font-semibold bg-transparent">
                  I'm looking for a place
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust signals bar */}
      <section className="border-b bg-card">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 py-5 px-6">
          {[
            { icon: ShieldCheck, label: "Manager Approved Listings", color: "text-emerald" },
            { icon: Users, label: "Verified Subtenants", color: "text-emerald" },
            { icon: FileText, label: "Digital Contracts", color: "text-emerald" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">How It Works</h2>
            <p className="mt-3 text-muted-foreground text-lg">Three simple steps to a hassle-free sublet</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              {
                step: "01",
                icon: Upload,
                title: "List Your Space",
                desc: "Upload your documents and create a detailed listing for your apartment.",
              },
              {
                step: "02",
                icon: ShieldCheck,
                title: "Get Approved",
                desc: "Your property manager reviews and approves the sublet request.",
              },
              {
                step: "03",
                icon: Users,
                title: "Move In",
                desc: "Sign the digital agreement and welcome your verified subtenant.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border bg-card p-8 text-center shadow-card hover:shadow-elevated transition-shadow"
              >
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

export default HomePage;
