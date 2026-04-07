import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Users, FileText, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (location.hash === "#how-it-works") {
      setTimeout(() => {
        document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.hash]);

  const handleChoice = (role: "tenant" | "subtenant") => {
    try {
      localStorage.setItem("subin_intent", role);
    } catch {}

    if (user) {
      if (role === "tenant") navigate("/listings/create");
      else navigate("/listings");
    } else {
      if (role === "tenant") navigate("/signup?intent=tenant");
      else navigate("/listings");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative w-screen min-h-screen overflow-hidden flex items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
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
        <div className="absolute inset-0 z-[1]" style={{ background: "rgba(100, 40, 5, 0.45)" }} />
        <div className="absolute inset-0 z-[2]" style={{ background: "linear-gradient(to bottom right, rgba(15, 6, 1, 0.6) 0%, rgba(90, 38, 4, 0.4) 50%, rgba(15, 6, 1, 0.7) 100%)" }} />
        <div className="absolute inset-0 z-[3]" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(10, 5, 2, 0.45) 100%)" }} />

        <div className="relative z-10 w-full max-w-3xl mx-auto px-6 py-20">
          <h1
            className="text-[28px] sm:text-5xl lg:text-6xl font-bold text-white text-center leading-[1.1] tracking-tight mb-10 sm:mb-14"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            The easiest way to
            <br />
            sublet in Boston
          </h1>

          {/* Two choice cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Card 1: Host */}
            <button
              onClick={() => handleChoice("tenant")}
              className="group rounded-2xl p-6 sm:p-8 text-left transition-all hover:scale-[1.02]"
              style={{ background: "rgba(10, 5, 2, 0.7)", backdropFilter: "blur(8px)" }}
            >
              <p className="text-[18px] font-bold text-white leading-snug">
                I have an apartment to sublet
              </p>
              <p className="mt-2 text-[15px] text-white/70 leading-relaxed">
                List your place and get it filled in days
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold text-white bg-primary hover:bg-primary/90 transition-colors">
                Start listing
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>

            {/* Card 2: Renter */}
            <button
              onClick={() => handleChoice("subtenant")}
              className="group rounded-2xl p-6 sm:p-8 text-left transition-all hover:scale-[1.02] bg-primary"
            >
              <p className="text-[18px] font-bold text-white leading-snug">
                I need a place to stay
              </p>
              <p className="mt-2 text-[15px] text-white/80 leading-relaxed">
                Find verified sublets below market rate
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-semibold text-primary bg-white hover:bg-white/90 transition-colors">
                Browse apartments
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        </div>

        {/* Hero-to-content gradient fade */}
        <div
          className="absolute bottom-0 left-0 right-0 z-[5] pointer-events-none"
          style={{ height: 160, background: "linear-gradient(to bottom, transparent 0%, rgba(10,10,10,0.4) 60%, rgba(10,10,10,0.85) 85%, #0a0a0a 100%)" }}
        />
      </section>

      {/* Trust signals bar */}
      <section style={{ backgroundColor: "#0a0a0a", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 py-5 px-6">
          {[
            { icon: ShieldCheck, label: "Verified hosts and renters" },
            { icon: Users, label: "Identity checked" },
            { icon: FileText, label: "Digital agreements" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 text-[13px] font-medium text-white/50">
              <item.icon className="h-5 w-5 text-emerald-500" />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-[28px] font-bold text-white">How it works</h2>
            <p className="mt-3 text-white/50 text-[15px]">Three steps to a hassle-free sublet</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              { step: "1", title: "List or browse", desc: "Hosts list their apartment in minutes. Renters browse verified sublets." },
              { step: "2", title: "Make a deal", desc: "Send offers, negotiate the price, and agree on dates that work for both sides." },
              { step: "3", title: "Sign and move in", desc: "Sign the digital agreement and move in. Payments are handled securely." },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl p-6 sm:p-8 text-center" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-[18px] font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="text-[18px] font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-[15px] text-white/60 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24" style={{ background: "linear-gradient(135deg, #1a0e05 0%, #2d1408 100%)" }}>
        <div className="container mx-auto text-center px-6">
          <h2 className="text-[28px] sm:text-4xl font-bold text-white">Ready to make a move?</h2>
          <p className="mt-4 text-white/70 text-[15px] max-w-md mx-auto">
            No commitment. No listing fees. Just faster subletting.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/listings">
              <Button size="lg" className="bg-white text-[#1a1008] hover:bg-white/90 rounded-full px-8 h-14 text-[15px] font-semibold border-0">
                Find a summer place
              </Button>
            </Link>
            <Link to="/signup?intent=tenant">
              <Button size="lg" variant="outline" className="border-2 border-white/40 text-white hover:bg-white/10 rounded-full px-8 h-14 text-[15px] font-semibold bg-transparent">
                List my apartment
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
