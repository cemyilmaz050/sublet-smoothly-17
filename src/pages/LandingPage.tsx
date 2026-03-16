import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Users, FileCheck, ArrowRight, Upload, CheckCircle2, Home, Star, Sparkles } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import heroImage from "@/assets/hero-apartment.jpg";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const LandingPage = () => {
  const { user, isReady } = useAuth();
  const [studentCount, setStudentCount] = useState<number>(0);

  useEffect(() => {
    // Fetch total confirmed bookings as "students who found a place"
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .then(({ count }) => setStudentCount(count || 0));
  }, []);

  if (isReady && user) {
    return <Navigate to="/listings" replace />;
  }

  const testimonials = [
    {
      name: "Emma",
      university: "BU Class of 2025",
      quote: "Found my summer place in 2 days. SubIn made it so easy — no sketchy Craigslist vibes.",
      rating: 5,
      color: "from-primary to-cyan",
    },
    {
      name: "Marcus",
      university: "Northeastern '26",
      quote: "Listed my apartment in 3 minutes and had 5 knocks the same day. Way better than Facebook groups.",
      rating: 5,
      color: "from-amber to-coral",
    },
    {
      name: "Priya",
      university: "MIT '25",
      quote: "The verified listings gave me peace of mind. Moved in with zero stress.",
      rating: 5,
      color: "from-emerald to-cyan",
    },
  ];

  const universities = ["MIT", "BU", "Northeastern", "Harvard", "Tufts"];

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
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm inline-flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> Trusted by students across Boston
            </Badge>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Summer in Boston{" "}
              <span className="text-primary">sorted</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Find a place from another student — short term, verified, and stress free. No brokers, no BS.
            </p>

            {/* Live stats */}
            {studentCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald/10 px-4 py-2 text-sm font-medium text-emerald"
              >
                <Sparkles className="h-4 w-4" />
                {studentCount} student{studentCount !== 1 ? "s" : ""} found their summer place on SubIn
              </motion.div>
            )}

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/signup?role=tenant">
                <Button variant="hero" size="xl">
                  I'm leaving my place 🗝️
                  <ArrowRight className="ml-1 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/signup?role=subtenant">
                <Button variant="heroOutline" size="xl">
                  I need a place 🏠
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
                alt="Modern apartment in Boston"
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

      {/* University Trust Badges */}
      <section className="border-t bg-card/50 py-8">
        <div className="container">
          <p className="mb-4 text-center text-sm font-medium text-muted-foreground">Trusted by students from</p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {universities.map((uni) => (
              <motion.div
                key={uni}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-sm"
              >
                <span className="text-lg">🎓</span>
                <span className="text-sm font-semibold text-foreground">{uni}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-foreground">How it works ✨</h2>
            <p className="mt-3 text-muted-foreground">Three simple steps — takes about 3 minutes</p>
          </motion.div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Upload,
                title: "List your place",
                description: "Snap some photos, set your price, and you're live. It's like posting on Instagram but for your apartment.",
                color: "bg-primary/10 text-primary",
              },
              {
                step: "02",
                icon: ShieldCheck,
                title: "Get the green light",
                description: "Your property manager reviews and approves everything right on the platform. No awkward emails.",
                color: "bg-amber/10 text-amber",
              },
              {
                step: "03",
                icon: Home,
                title: "Match & move in",
                description: "Find a verified guest, sign digitally, and hand over the keys. Easy as that 🤝",
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
      <section className="border-t bg-card py-20">
        <div className="container">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Manager Approved",
                description: "Every listing needs your property manager's thumbs up before going live. No shady sublets here.",
                gradient: "from-primary/10 to-primary/5",
              },
              {
                icon: Users,
                title: "Verified Students",
                description: "ID check, .edu email verification, and background consent. You'll know who you're subletting to.",
                gradient: "from-emerald/10 to-emerald/5",
              },
              {
                icon: FileCheck,
                title: "Digital Agreements",
                description: "Auto-generated contracts with e-signatures. No printing, no scanning, no headaches.",
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

      {/* Sublet Stories — Testimonials */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-foreground">Sublet Stories 💬</h2>
            <p className="mt-3 text-muted-foreground">Real students. Real places. Real easy.</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, index) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border bg-card p-6 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${t.color} text-primary-foreground font-bold text-lg`}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.university}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber text-amber" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-card py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to find your summer spot? 🌞</h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Join hundreds of students who trust SubIn for safe, verified sublets in Boston.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <Button variant="hero" size="xl">
                Get Started — It's Free
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Campus Ambassador Banner */}
      <section className="border-t bg-gradient-to-r from-primary/5 to-accent/30 py-12">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-2xl font-bold text-foreground">Be the SubIn rep at your university 🎓</p>
            <p className="mt-2 text-muted-foreground">
              Earn $50 for every successful sublet you refer. Apply to become a campus ambassador.
            </p>
            <Link to="/refer">
              <Button variant="outline" className="mt-6" size="lg">
                Apply Now
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">SubIn</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 SubIn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
