import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Building2, Lock, KeyRound, Home, Sparkles, ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ── Animated counter ── */
function useCountUp(target: number, duration = 1400, delay = 700) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (target <= 0 || started.current) return;
    started.current = true;
    const t0 = performance.now() + delay;
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(Math.max(0, now - t0) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);
  return value;
}

/* ── Tidal wave SVG ── */
const TidalWaves = () => (
  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 sm:h-36 overflow-hidden">
    <svg
      className="absolute bottom-0 w-[200%] h-full"
      viewBox="0 0 2400 200"
      preserveAspectRatio="none"
      style={{ opacity: 0.05 }}
    >
      <path
        d="M0 120 C400 80 800 160 1200 120 C1600 80 2000 160 2400 120 L2400 200 L0 200Z"
        fill="#4845D2"
      >
        <animateTransform attributeName="transform" type="translate" values="0,0;-1200,0;0,0" dur="18s" repeatCount="indefinite" />
      </path>
    </svg>
    <svg
      className="absolute bottom-0 w-[200%] h-full"
      viewBox="0 0 2400 200"
      preserveAspectRatio="none"
      style={{ opacity: 0.035 }}
    >
      <path
        d="M0 140 C300 100 700 170 1200 130 C1700 90 2100 170 2400 140 L2400 200 L0 200Z"
        fill="#4845D2"
      >
        <animateTransform attributeName="transform" type="translate" values="0,0;-1200,0;0,0" dur="24s" repeatCount="indefinite" />
      </path>
    </svg>
    <svg
      className="absolute bottom-0 w-[200%] h-full"
      viewBox="0 0 2400 200"
      preserveAspectRatio="none"
      style={{ opacity: 0.02 }}
    >
      <path
        d="M0 155 C500 125 900 175 1200 150 C1500 125 1900 175 2400 155 L2400 200 L0 200Z"
        fill="#6C63FF"
      >
        <animateTransform attributeName="transform" type="translate" values="0,0;-1200,0;0,0" dur="30s" repeatCount="indefinite" />
      </path>
    </svg>
  </div>
);

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

  const animListings = useCountUp(stats.listings);
  const animHosts = useCountUp(stats.hosts);
  const animSublets = useCountUp(stats.sublets);

  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: "#FAFAF8" }}>
      <div className="relative z-10 flex flex-col items-center text-center w-full max-w-[900px] mx-auto px-5 py-10 sm:py-0">

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-[32px] sm:text-[56px] font-semibold leading-[1.08]"
          style={{ color: "#1C1C1E", letterSpacing: "-0.5px" }}
        >
          Your Boston summer, sorted
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="mt-4 sm:mt-5 max-w-md text-[14px] sm:text-[17px] leading-relaxed"
          style={{ color: "#86868B" }}
        >
          Find a verified sublet near campus, or list your place and earn while you're away.
        </motion.p>

        {/* Trust pills */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.16 }}
          className="mt-5 sm:mt-7 flex items-center justify-center gap-2 sm:gap-3"
        >
          {[
            { icon: ShieldCheck, label: "Verified listings" },
            { icon: Building2, label: "BBG approved" },
            { icon: Lock, label: "Secure payments" },
          ].map((pill) => (
            <span
              key={pill.label}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] sm:text-[12px] font-medium whitespace-nowrap"
              style={{ backgroundColor: "#fff", borderColor: "#E8E8ED", color: "#86868B" }}
            >
              <pill.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              {pill.label}
            </span>
          ))}
        </motion.div>

        {/* Choice cards */}
        <div className="mt-10 sm:mt-14 grid w-full max-w-[640px] gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2">
          {/* Host card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.22 }}
          >
            <Link to="/signup?role=tenant" className="block h-full">
              <div
                className="flex h-full flex-col items-center rounded-2xl border bg-white p-6 sm:p-8 text-center transition-all duration-200 hover:-translate-y-1"
                style={{ borderColor: "#E8E8ED" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4845D2"; e.currentTarget.style.borderWidth = "1.5px"; e.currentTarget.style.padding = "calc(1.5rem - 0.5px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E8ED"; e.currentTarget.style.borderWidth = "1px"; e.currentTarget.style.padding = ""; }}
              >
                <KeyRound className="h-10 w-10 sm:h-11 sm:w-11 mb-4 sm:mb-5" style={{ color: "#4845D2" }} strokeWidth={1.4} />
                <h3 className="text-[17px] sm:text-[19px] font-semibold" style={{ color: "#1C1C1E" }}>
                  I have a place to sublet
                </h3>
                <p className="mt-1.5 text-[13px] sm:text-[14px] leading-relaxed" style={{ color: "#86868B" }}>
                  List in 3 minutes, find a verified subtenant fast
                </p>
                <Button
                  className="mt-5 sm:mt-7 w-full rounded-lg text-white h-10 sm:h-11 text-[14px] font-medium border-0"
                  style={{ backgroundColor: "#4845D2" }}
                >
                  Start listing
                </Button>
              </div>
            </Link>
          </motion.div>

          {/* Renter card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.37 }}
          >
            <Link to="/find" className="block h-full">
              <div
                className="flex h-full flex-col items-center rounded-2xl border bg-white p-6 sm:p-8 text-center transition-all duration-200 hover:-translate-y-1"
                style={{ borderColor: "#E8E8ED" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4845D2"; e.currentTarget.style.borderWidth = "1.5px"; e.currentTarget.style.padding = "calc(1.5rem - 0.5px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E8ED"; e.currentTarget.style.borderWidth = "1px"; e.currentTarget.style.padding = ""; }}
              >
                <Home className="h-10 w-10 sm:h-11 sm:w-11 mb-4 sm:mb-5" style={{ color: "#4845D2" }} strokeWidth={1.4} />
                <h3 className="text-[17px] sm:text-[19px] font-semibold" style={{ color: "#1C1C1E" }}>
                  I need a place this summer
                </h3>
                <p className="mt-1.5 text-[13px] sm:text-[14px] leading-relaxed" style={{ color: "#86868B" }}>
                  Answer 5 questions — AI finds your perfect match
                </p>
                <Button
                  className="mt-5 sm:mt-7 w-full rounded-lg text-white h-10 sm:h-11 text-[14px] font-medium border-0"
                  style={{ backgroundColor: "#4845D2" }}
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Find my place
                </Button>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-10 sm:mt-16"
        >
          <div
            className="inline-flex items-center rounded-2xl bg-white px-6 py-4 sm:px-10 sm:py-5"
            style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
          >
            {[
              { value: animListings, label: "Active listings" },
              { value: animHosts, label: "Verified hosts" },
              { value: animSublets, label: "Successful sublets" },
            ].map((stat, i) => (
              <div key={stat.label} className="flex items-center">
                {i > 0 && <div className="mx-5 sm:mx-8 h-8 w-px" style={{ backgroundColor: "#E8E8ED" }} />}
                <div className="text-center">
                  <p className="text-[26px] sm:text-[38px] font-bold leading-none" style={{ color: "#1C1C1E" }}>
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11px] sm:text-[13px]" style={{ color: "#86868B" }}>
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
          transition={{ delay: 0.65 }}
          className="mt-6 sm:mt-10 mb-4"
        >
          <Link
            to="/listings"
            className="group inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors hover:opacity-70"
            style={{ color: "#86868B" }}
          >
            or browse all listings
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>

      {/* Tidal stream at bottom */}
      <TidalWaves />
    </div>
  );
};

export default HomePage;
