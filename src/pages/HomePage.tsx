import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, FileText, ArrowRight, CheckCircle2, Upload } from "lucide-react";
import PhoneMock from "@/components/landing/PhoneMock";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero — full screen, warm cinematic */}
      <section className="relative flex min-h-screen overflow-hidden">
        {/* Warm background image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1920&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Warm cinematic overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(15, 8, 3, 0.75) 0%, rgba(40, 20, 5, 0.65) 100%)",
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(10, 5, 2, 0.45) 100%)",
          }}
        />

        {/* Phone — centered */}
        <div className="absolute inset-0 z-[5] flex items-center justify-center pointer-events-none">
          <div className="opacity-95 drop-shadow-2xl" style={{ filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.5))" }}>
            <PhoneMock />
          </div>
        </div>

        {/* Hero content — bottom aligned */}
        <div className="relative z-10 w-full flex flex-col sm:flex-row items-end justify-between px-6 sm:px-10 lg:px-16 pb-16 sm:pb-20 mt-auto">
          {/* Left: Main heading */}
          <div className="mb-8 sm:mb-0">
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05] tracking-tight"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Sublet your apartment
              <br />
              the right way
            </h1>
          </div>

          {/* Right: CTA */}
          <div className="flex flex-col items-start sm:items-end">
            <Link to="/signup?role=tenant">
              <Button
                size="lg"
                className="bg-white text-[#1a1008] hover:bg-white/90 rounded-full px-10 h-14 text-base font-semibold shadow-xl border-0"
              >
                I'm a Tenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-4 text-white/60 text-sm leading-relaxed text-left sm:text-right max-w-[260px]">
              The trusted platform for tenants,
              <br />
              subtenants, and property managers.
            </p>
          </div>
        </div>
      </section>

      {/* Trust signals bar */}
      <section className="border-b bg-card">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 py-5 px-6">
          {[
            { icon: ShieldCheck, label: "Manager Approved Listings" },
            { icon: Users, label: "Verified Subtenants" },
            { icon: FileText, label: "Digital Contracts" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
              <item.icon className="h-5 w-5 text-emerald-500" />
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
