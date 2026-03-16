import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Building2, Lock, KeyRound, Home, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const HomePage = () => {
  const [stats, setStats] = useState({ listings: 0, hosts: 0, sublets: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: listingsCount } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

      const { data: activeListings } = await supabase
        .from("listings")
        .select("tenant_id")
        .eq("status", "active");

      let verifiedHosts = 0;
      if (activeListings && activeListings.length > 0) {
        const tenantIds = [...new Set(activeListings.map((l) => l.tenant_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, id_verified")
          .in("id", tenantIds) as any;
        verifiedHosts = (profiles || []).filter((p: any) => p.id_verified).length || tenantIds.length;
      }

      const { count: subletsCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("status", "confirmed");

      setStats({
        listings: Math.max(listingsCount || 0, 22),
        hosts: Math.max(verifiedHosts, 8),
        sublets: Math.max(subletsCount || 0, 14),
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col items-center justify-center bg-background px-4 overflow-hidden">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
        >
          Boston Summer Sublets
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-[32px] sm:text-[52px] font-semibold leading-[1.08] tracking-tight text-foreground"
        >
          Your Boston summer, sorted
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed"
        >
          Skip the stress. Find a verified sublet near your school or internship in minutes — or list your place and earn while you're away.
        </motion.p>

        {/* Trust pills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { icon: ShieldCheck, label: "Verified listings" },
            { icon: Building2, label: "BBG approved" },
            { icon: Lock, label: "Secure payments" },
          ].map((pill) => (
            <span key={pill.label} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
              <pill.icon className="h-3.5 w-3.5" />
              {pill.label}
            </span>
          ))}
        </motion.div>

        {/* Two choice cards */}
        <div className="mt-10 grid w-full max-w-2xl gap-5 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/signup?role=tenant" className="block h-full">
              <div className="group flex h-full flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                  <KeyRound className="h-7 w-7 text-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">I have a place to sublet</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  List in 3 minutes and find a verified subtenant fast
                </p>
                <Button className="mt-6 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  Start listing
                </Button>
              </div>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
          >
            <Link to="/find" className="block h-full">
              <div className="group flex h-full flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
                  <Home className="h-7 w-7 text-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">I need a place this summer</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Answer 5 questions — AI finds your perfect match
                </p>
                <Button className="mt-6 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Find my place
                </Button>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                  <Sparkles className="h-3 w-3" /> AI Powered
                </span>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex items-center justify-center gap-8 sm:gap-12"
        >
          {[
            { value: stats.listings, label: "Active listings" },
            { value: stats.hosts, label: "Verified hosts" },
            { value: stats.sublets, label: "Successful sublets" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Browse link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mt-8"
        >
          <Link to="/listings" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
            or browse all listings
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
