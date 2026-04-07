import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const LandingPage = () => {
  const { user, isReady } = useAuth();

  if (isReady && user) {
    return <Navigate to="/listings" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h1 className="text-[28px] sm:text-4xl font-bold text-foreground">How it works</h1>
            <p className="mt-3 text-muted-foreground text-[15px]">Three steps to a hassle-free sublet</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              { step: "1", title: "List or browse", desc: "Hosts list their apartment in minutes. Renters browse verified sublets." },
              { step: "2", title: "Make a deal", desc: "Send offers, negotiate the price, and agree on dates." },
              { step: "3", title: "Sign and move in", desc: "Sign the digital agreement and move in. Payments handled securely." },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border bg-card p-6 sm:p-8 text-center shadow-card">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-[18px] font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="text-[18px] font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">{item.desc}</p>
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
              { icon: ShieldCheck, title: "Verified identities", description: "Every host and renter is identity verified before any transaction." },
              { icon: FileText, title: "Digital agreements", description: "Legally binding sublet agreements generated and signed in the platform." },
              { icon: ShieldCheck, title: "Secure payments", description: "All payments processed through Stripe. Your money is protected." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border bg-card p-6 sm:p-8 shadow-card">
                <item.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-[18px] font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-[15px] text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary">
        <div className="container mx-auto text-center px-6">
          <h2 className="text-[28px] sm:text-4xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-4 text-white/80 text-[15px] max-w-md mx-auto">
            Join hosts and renters using SubIn to sublet the easy way.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="outline" className="mt-8 border-2 border-white text-white hover:bg-white/10 rounded-full px-10 h-12 text-[15px] font-semibold bg-transparent">
              Create your account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
