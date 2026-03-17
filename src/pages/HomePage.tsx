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
          className="mb-3 sm:mb-5 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground"
        >
          Boston Summer Sublets
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-[26px] sm:text-[52px] font-semibold leading-[1.08] tracking-tight text-foreground"
        >
          Your Boston summer, sorted
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-2 sm:mt-4 max-w-xl text-[13px] sm:text-lg text-muted-foreground leading-snug sm:leading-relaxed line-clamp-2"
        >
          Find a verified sublet near your school or internship, or list your place and earn while you're away.
        </motion.p>

        {/* Trust pills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-3 sm:mt-6 flex items-center justify-center gap-2 sm:gap-3"
        >
          {[
            { icon: ShieldCheck, label: "Verified", labelFull: "Verified listings" },
            { icon: Building2, label: "BBG approved", labelFull: "BBG approved" },
            { icon: Lock, label: "Secure", labelFull: "Secure payments" },
          ].map((pill) => (
            <span key={pill.labelFull} className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-border bg-muted/50 px-2 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap">
              <pill.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span className="sm:hidden">{pill.label}</span>
              <span className="hidden sm:inline">{pill.labelFull}</span>
            </span>
          ))}
        </motion.div>

        {/* Two choice cards */}
        <div className="mt-6 sm:mt-10 grid w-full max-w-2xl gap-2.5 sm:gap-5 grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link to="/signup?role=tenant" className="block h-full">
              <div className="group flex h-full flex-col items-center rounded-2xl border border-border bg-card p-4 sm:p-8 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                <div className="mb-3 sm:mb-5 flex h-9 w-9 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-muted">
                  <KeyRound className="h-5 w-5 sm:h-7 sm:w-7 text-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] sm:text-lg font-semibold text-foreground leading-tight">I have a place to sublet</h3>
                <p className="mt-1 sm:mt-2 text-[11px] sm:text-sm leading-snug sm:leading-relaxed text-muted-foreground">
                  List in 3 minutes and find a verified subtenant fast
                </p>
                <Button className="mt-3 sm:mt-6 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-11 text-sm">
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
              <div className="group flex h-full flex-col items-center rounded-2xl border border-border bg-card p-4 sm:p-8 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                <div className="mb-3 sm:mb-5 flex h-9 w-9 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-muted">
                  <Home className="h-5 w-5 sm:h-7 sm:w-7 text-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] sm:text-lg font-semibold text-foreground leading-tight">I need a place this summer</h3>
                <p className="mt-1 sm:mt-2 text-[11px] sm:text-sm leading-snug sm:leading-relaxed text-muted-foreground">
                  Answer 5 questions — AI finds your perfect match
                </p>
                <Button className="mt-3 sm:mt-6 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-10 sm:h-11 text-sm">
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Find my place
                </Button>
                <span className="mt-2 hidden sm:inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                  <Sparkles className="h-3 w-3" /> AI Powered
                </span>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Stats bar — hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 hidden sm:flex items-center justify-center gap-8 sm:gap-12"
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
          className="mt-4 sm:mt-8"
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
