import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, FileCheck, ArrowRight, Upload, CheckCircle2, ClipboardCheck, Home, Building2, Handshake } from "lucide-react";
import heroImage from "@/assets/hero-apartment.jpg";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero — full screen with real photo */}
      <section className="relative flex min-h-[85vh] items-center">
        <img
          src={heroImage}
          alt="Boston apartment"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 px-6 py-20 sm:px-12 lg:px-20">
          <h1 className="max-w-lg text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Sublet your apartment the right way
          </h1>
          <p className="mt-4 max-w-md text-lg text-white/80">
            The trusted platform for tenants, subtenants, and property managers
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/signup?role=tenant">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 text-base font-semibold">
                I am a tenant
              </Button>
            </Link>
            <Link to="/listings">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 h-12 text-base font-semibold">
                I am looking for a place
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust signals bar */}
      <section className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-8 px-6 py-6 sm:gap-16">
          {[
            { icon: ShieldCheck, label: "Manager Approved Listings" },
            { icon: Users, label: "Verified Subtenants" },
            { icon: FileCheck, label: "Digital Contracts" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 text-sm font-medium text-foreground">
              <item.icon className="h-5 w-5 text-primary" />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* How It Works — Tenants */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-3xl font-bold text-foreground">How It Works</h2>
          <p className="mt-2 text-center text-muted-foreground">For tenants subletting their apartment</p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { step: "1", icon: Upload, title: "List your place", desc: "Add photos, set your price, and describe your apartment." },
              { step: "2", icon: Building2, title: "Manager reviews", desc: "Your property manager approves the listing on the platform." },
              { step: "3", icon: Users, title: "Get applicants", desc: "Verified subtenants browse and knock on your listing." },
              { step: "4", icon: ClipboardCheck, title: "Sign documents", desc: "Complete the sublet application and guaranty digitally." },
              { step: "5", icon: Handshake, title: "Hand over keys", desc: "Finalize the agreement and collect your first payment." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works — Property Managers */}
      <section className="border-t bg-card py-20">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-center text-2xl font-bold text-foreground">For Property Managers</h2>
          <p className="mt-2 text-center text-muted-foreground">Stay in control of every sublet in your building</p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", icon: CheckCircle2, title: "Review requests", desc: "Tenants submit sublet requests through the platform for your approval." },
              { step: "2", icon: FileCheck, title: "Verify documents", desc: "Review completed applications and guaranty forms digitally." },
              { step: "3", icon: ShieldCheck, title: "Approve subtenants", desc: "Run background checks and approve qualified subtenants." },
              { step: "4", icon: Home, title: "Monitor sublets", desc: "Track active sublets, payments, and lease compliance." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-lg px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to get started?</h2>
          <p className="mt-3 text-muted-foreground">
            Create your account and start subletting the right way.
          </p>
          <Link to="/signup">
            <Button size="lg" className="mt-8 px-10 h-12 text-base font-semibold">
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
