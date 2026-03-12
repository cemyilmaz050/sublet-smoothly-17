import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Users, FileCheck, ArrowRight, Upload, CheckCircle2, Home } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import heroImage from "@/assets/hero-apartment.jpg";
import { useAuth } from "@/hooks/useAuth";

const LandingPage = () => {
  const { user, isReady, role } = useAuth();

  // Redirect logged-in users to their dashboard
  if (isReady && user) {
    const dest = role === "subtenant" ? "/dashboard/subtenant" : role === "manager" ? "/dashboard/manager" : "/dashboard/tenant";
    return <Navigate to={dest} replace />;
  }


  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/30" />
        <div className="container relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
              ✨ Trusted by 2,000+ tenants
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Sublet your apartment{" "}
              <span className="text-primary">the right way</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              The only platform where every sublet is manager-approved, every subtenant is verified, and every agreement is digital.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/signup?role=tenant">
                <Button variant="hero" size="xl">
                  I'm a Tenant
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/signup?role=subtenant">
                <Button variant="heroOutline" size="xl">
                  I'm looking for a place
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="overflow-hidden rounded-2xl shadow-elevated">
              <img
                src={heroImage}
                alt="Modern apartment building"
                className="h-[480px] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-xl bg-card p-4 shadow-elevated">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald/15">
                  <CheckCircle2 className="h-5 w-5 text-emerald" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Manager Approved</p>
                  <p className="text-xs text-muted-foreground">Verified listing</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-card py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground">How it works</h2>
            <p className="mt-3 text-muted-foreground">Three simple steps to a safe, approved sublet</p>
          </motion.div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Upload,
                title: "List & Upload Documents",
                description: "Upload your lease, proof of residence, and sublet request. We guide you through every step.",
                color: "bg-primary/10 text-primary",
              },
              {
                step: "02",
                icon: ShieldCheck,
                title: "Get Manager Approval",
                description: "Your property manager reviews and approves the sublet request directly on the platform.",
                color: "bg-amber/10 text-amber",
              },
              {
                step: "03",
                icon: Home,
                title: "Match & Move In",
                description: "Find a verified subtenant, sign a digital agreement, and complete the handoff seamlessly.",
                color: "bg-emerald/10 text-emerald",
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="group relative rounded-xl border bg-card p-8 transition-all hover:shadow-elevated"
              >
                <span className="text-5xl font-extrabold text-muted/60">{item.step}</span>
                <div className={`mt-4 flex h-12 w-12 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Manager Approved Listings",
                description: "Every listing requires explicit property manager approval before going live.",
                gradient: "from-primary/10 to-primary/5",
              },
              {
                icon: Users,
                title: "Verified Subtenants",
                description: "Government ID, income verification, and background check consent required.",
                gradient: "from-emerald/10 to-emerald/5",
              },
              {
                icon: FileCheck,
                title: "Digital Contracts",
                description: "Auto-generated agreements with e-signatures for all parties involved.",
                gradient: "from-cyan/10 to-cyan/5",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`rounded-xl bg-gradient-to-br ${item.gradient} p-8`}
              >
                <item.icon className="h-8 w-8 text-foreground" />
                <h3 className="mt-4 text-lg font-bold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-card py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to sublet the right way?</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Join thousands of tenants and subtenants who trust SubletSafe for secure, manager-approved sublets.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <Button variant="hero" size="xl">
                Get Started Free
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">SubletSafe</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 SubletSafe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
