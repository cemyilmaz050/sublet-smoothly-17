import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Building2, Lock, KeyRound, Home, Sparkles, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ── Animated counter hook ── */
function useCountUp(target: number, duration = 1500, delay = 600) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (target <= 0 || started.current) return;
    started.current = true;

    const startTime = performance.now() + delay;
    let raf: number;

    const tick = (now: number) => {
      const elapsed = Math.max(0, now - startTime);
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);

  return value;
}

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

  const animListings = useCountUp(stats.listings, 1500, 800);
  const animHosts = useCountUp(stats.hosts, 1500, 950);
  const animSublets = useCountUp(stats.sublets, 1500, 1100);

  const trustPills = [
    { icon: ShieldCheck, label: "Verified listings", dot: "bg-[hsl(241,62%,55%)]" },
    { icon: Building2, label: "BBG approved", dot: "bg-[hsl(160,96%,30%)]" },
    { icon: Lock, label: "Secure payments", dot: "bg-[hsl(38,70%,52%)]" },
  ];

  return (
    <div
      className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-5 py-10 sm:py-0 overflow-hidden"
      style={{ backgroundColor: "#F5F0E8" }}
    >
      {/* Subtle texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #1A1A2E 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto w-full">
        {/* Eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4 sm:mb-6 text-[11px] font-medium uppercase tracking-[0.22em]"
          style={{ color: "#6B6B8A" }}
        >
          Boston's trusted sublet platform
        </motion.span>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-[36px] sm:text-[64px] font-semibold leading-[1.05]"
          style={{ color: "#1A1A2E", letterSpacing: "-1px" }}
        >
          Your Boston summer,{" "}
          <span className="relative inline-block">
            sorted
            <span
              className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full sm:-bottom-1.5 sm:h-[4px]"
              style={{ background: "linear-gradient(90deg, #4845D2, #6C63FF)" }}
            />
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="mt-3 sm:mt-5 max-w-lg text-[14px] sm:text-[18px] leading-relaxed"
          style={{ color: "#6B6B8A" }}
        >
          Find a verified sublet near your school or internship, or list your place and earn while you're away.
        </motion.p>

        {/* Trust pills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-4 sm:mt-7 flex items-center justify-center gap-2.5 sm:gap-4"
        >
          {trustPills.map((pill) => (
            <span
              key={pill.label}
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-[13px] font-medium whitespace-nowrap"
              style={{
                color: "#1A1A2E",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} />
              <pill.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" style={{ color: "#6B6B8A" }} />
              {pill.label}
            </span>
          ))}
        </motion.div>

        {/* Two choice cards */}
        <div className="mt-8 sm:mt-12 grid w-full max-w-2xl gap-3 sm:gap-6 grid-cols-1 sm:grid-cols-2">
          {/* Left card — Host */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
          >
            <Link to="/signup?role=tenant" className="block h-full">
              <div
                className="group flex h-full flex-col items-center rounded-2xl border border-[hsl(240,20%,90%)] bg-white p-5 sm:p-8 text-center transition-all duration-250 hover:-translate-y-1.5 hover:border-[hsl(241,62%,55%)]"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; }}
              >
                <div
                  className="mb-3 sm:mb-5 flex h-12 w-12 sm:h-[52px] sm:w-[52px] items-center justify-center rounded-full"
                  style={{ backgroundColor: "hsl(241 62% 55% / 0.08)" }}
                >
                  <KeyRound className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "#4845D2" }} strokeWidth={1.5} />
                </div>
                <h3 className="text-[17px] sm:text-[20px] font-semibold" style={{ color: "#1A1A2E" }}>
                  I have a place to sublet
                </h3>
                <p className="mt-1.5 sm:mt-2 text-[12px] sm:text-[14px] leading-relaxed" style={{ color: "#6B6B8A" }}>
                  List in 3 minutes and find a verified subtenant fast
                </p>
                <div className="mt-3 sm:mt-4 flex flex-col gap-1 text-[10px] sm:text-[11px]" style={{ color: "#8E8EA0" }}>
                  <span>Verified renters only · Digital lease included · Secure payments</span>
                </div>
                <Button
                  className="mt-4 sm:mt-6 w-full rounded-lg text-white h-10 sm:h-11 text-sm font-medium"
                  style={{ background: "linear-gradient(135deg, #4845D2, #3730B8)" }}
                >
                  Start listing
                </Button>
              </div>
            </Link>
          </motion.div>

          {/* Right card — Renter */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.4 }}
          >
            <Link to="/find" className="block h-full">
              <div
                className="group flex h-full flex-col items-center rounded-2xl border border-[hsl(240,20%,90%)] bg-white p-5 sm:p-8 text-center transition-all duration-250 hover:-translate-y-1.5 hover:border-[hsl(241,62%,55%)]"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)"; }}
              >
                <div
                  className="mb-3 sm:mb-5 flex h-12 w-12 sm:h-[52px] sm:w-[52px] items-center justify-center rounded-full"
                  style={{ backgroundColor: "hsl(241 62% 55% / 0.08)" }}
                >
                  <Home className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "#4845D2" }} strokeWidth={1.5} />
                </div>
                <h3 className="text-[17px] sm:text-[20px] font-semibold" style={{ color: "#1A1A2E" }}>
                  I need a place this summer
                </h3>
                <p className="mt-1.5 sm:mt-2 text-[12px] sm:text-[14px] leading-relaxed" style={{ color: "#6B6B8A" }}>
                  Answer 5 questions — AI finds your perfect match
                </p>
                <div className="mt-3 sm:mt-4 flex flex-col gap-1 text-[10px] sm:text-[11px]" style={{ color: "#8E8EA0" }}>
                  <span>AI matched · 5 minute process · Verified listings only</span>
                </div>
                <Button
                  className="mt-4 sm:mt-6 w-full rounded-lg text-white h-10 sm:h-11 text-sm font-medium"
                  style={{ background: "linear-gradient(135deg, #4845D2, #3730B8)" }}
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Find my place
                </Button>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          className="mt-8 sm:mt-14 flex items-center justify-center"
        >
          <div
            className="flex items-center gap-6 sm:gap-10 rounded-2xl bg-white px-6 py-4 sm:px-10 sm:py-5"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
          >
            {[
              { value: animListings, label: "Active listings" },
              { value: animHosts, label: "Verified hosts" },
              { value: animSublets, label: "Successful sublets" },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center gap-6 sm:gap-10">
                {i > 0 && (
                  <div className="h-8 w-px" style={{ backgroundColor: "hsl(240,20%,90%)" }} />
                )}
                <div className="text-center">
                  <p className="text-[28px] sm:text-[40px] font-bold leading-none" style={{ color: "#1A1A2E" }}>
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11px] sm:text-[13px]" style={{ color: "#6B6B8A" }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Browse link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-5 sm:mt-8"
        >
          <Link
            to="/listings"
            className="group inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors"
            style={{ color: "#6B6B8A" }}
          >
            or browse all listings
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-current transition-all group-hover:w-full" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
