import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, FileText, CreditCard, Clock, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

/* ───────────── helpers ───────────── */
const fmt = (n: number) => `$${n.toLocaleString()}`;

const sampleListings = [
  { id: 1, address: "145 Beacon St, Boston", beds: 2, baths: 1, market: 3200, asking: 2350, photo: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80", deadline: "3d 8h" },
  { id: 2, address: "88 Commonwealth Ave, Boston", beds: 1, baths: 1, market: 2800, asking: 2100, photo: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80", deadline: "1d 14h" },
  { id: 3, address: "312 Newbury St, Boston", beds: 3, baths: 2, market: 4500, asking: 3200, photo: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80", deadline: "5d 2h" },
];

function savingsPct(market: number, asking: number) {
  return Math.round(((market - asking) / market) * 100);
}

/* ───────────── page ───────────── */
const UrgentLandingPage = () => {
  const navigate = useNavigate();
  const [renterBudget, setRenterBudget] = useState(1400);
  const [subletterRent, setSubletterRent] = useState(2400);

  const renterListingCount = Math.max(1, Math.round((renterBudget / 1500) * 8));
  const subletterDrop = Math.round(subletterRent * 0.82);

  return (
    <div className="min-h-screen">
      {/* ════════ 1. HERO ════════ */}
      <section
        className="relative flex min-h-screen items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1a0e05 0%, #2d1a0a 50%, #1a0e05 100%)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/30 via-transparent to-black/40 pointer-events-none" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center pt-24 pb-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-6">
            Pay less. Sublet faster.
            <br />
            <span className="text-amber-300">The summer rental marketplace.</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-[rgba(255,235,210,0.85)] mb-10" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            Subletters name their floor. Renters name their budget. Everyone wins.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/urgent")}
              className="rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 py-6 text-base font-semibold"
            >
              I need a place this summer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/listings/create")}
              className="rounded-full border-white/40 text-white hover:bg-white/10 px-8 py-6 text-base font-semibold"
            >
              I want to sublet my apartment
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[120px] bg-gradient-to-b from-transparent to-white pointer-events-none z-10" />
      </section>

      {/* ════════ 2. HOW IT WORKS ════════ */}
      <section className="bg-white py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-14">How it works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Renter column */}
            <Card className="border-t-4 border-t-[#7C3AED] shadow-sm">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-foreground mb-6">Looking for a place</h3>
                {[
                  { step: 1, title: "Set your budget", desc: "Enter the maximum amount you are willing to pay per month. No commitment yet." },
                  { step: 2, title: "Browse urgent listings", desc: "See apartments where subletters are ready to negotiate. All below market rate." },
                  { step: 3, title: "Make an offer", desc: "Send your offer directly to the subletter. If it works for both sides, you are in." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4 mb-6 last:mb-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7C3AED]/10 text-sm font-bold text-[#7C3AED]">
                      {s.step}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{s.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Subletter column */}
            <Card className="border-t-4 border-t-amber-500 shadow-sm">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-foreground mb-6">Subletting your place</h3>
                {[
                  { step: 1, title: "Set your floor price", desc: "Enter the minimum amount you are willing to accept. Only you can see this." },
                  { step: 2, title: "List as urgent", desc: "Your apartment gets priority placement and a countdown to create urgency." },
                  { step: 3, title: "Accept the best offer", desc: "Review incoming offers and accept, counter, or decline. Done in days not weeks." },
                ].map((s) => (
                  <div key={s.step} className="flex gap-4 mb-6 last:mb-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-sm font-bold text-amber-600">
                      {s.step}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{s.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ════════ 3. TWO PILLARS ════════ */}
      <section className="bg-muted/50 py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-14">
            Built around what actually matters to you
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-sm">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-foreground mb-3">Stop paying rent on an empty apartment</h3>
                <p className="text-muted-foreground mb-6">
                  Every day your apartment sits empty you are losing money. SubIn Urgent gets your place filled fast — even if it means dropping the price slightly. A lower rent is always better than no rent.
                </p>
                <p className="text-3xl font-bold text-[#7C3AED]">Average time to fill: 4 days</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-foreground mb-3">Get a great apartment for less than market rate</h3>
                <p className="text-muted-foreground mb-6">
                  Subletters need to move fast and they know it. That urgency works in your favor. Set your budget, make your offer, and move into a place you could not normally afford.
                </p>
                <p className="text-3xl font-bold text-amber-600">Average savings vs market rate: 22%</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ════════ 4. LIVE MARKETPLACE PREVIEW ════════ */}
      <section className="bg-white py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-12">Live right now in Boston</h2>
          <div className="flex gap-6 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory scrollbar-hide">
            {sampleListings.map((l) => (
              <Card key={l.id} className="min-w-[300px] max-w-[320px] shrink-0 snap-start overflow-hidden shadow-sm">
                <div className="relative h-44 overflow-hidden">
                  <img src={l.photo} alt={l.address} className="h-full w-full object-cover" />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-red-500 text-white border-0 animate-pulse text-xs font-semibold px-2 py-0.5">
                      <Clock className="h-3 w-3 mr-1" />
                      Fills in {l.deadline}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-emerald-500 text-white border-0 text-xs font-semibold">
                      Save {savingsPct(l.market, l.asking)}%
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground line-through">{fmt(l.market)}/mo market rate</p>
                  <p className="text-xl font-bold text-foreground">{fmt(l.asking)}/mo</p>
                  <p className="text-sm text-muted-foreground mt-1">{l.address}</p>
                  <p className="text-xs text-muted-foreground">{l.beds} bed · {l.baths} bath</p>
                  <Button
                    className="w-full mt-4 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-semibold"
                    onClick={() => navigate("/urgent")}
                  >
                    Make an Offer
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            These are real listings from subletters ready to negotiate today
          </p>
          <div className="text-center mt-6">
            <Button
              onClick={() => navigate("/urgent")}
              className="rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-8 py-6 text-base font-semibold"
            >
              Browse All Urgent Listings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ════════ 5. BUDGET MATCHER ════════ */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(180deg, #FFF7ED 0%, #FFFBF5 100%)" }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-14">
            See what you can get for your budget
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            {/* Renter slider */}
            <Card className="shadow-sm">
              <CardContent className="p-8">
                <p className="text-sm font-medium text-muted-foreground mb-2">My monthly budget</p>
                <p className="text-4xl font-bold text-[#7C3AED] mb-6">{fmt(renterBudget)}</p>
                <Slider
                  value={[renterBudget]}
                  onValueChange={(v) => setRenterBudget(v[0])}
                  min={500}
                  max={4000}
                  step={50}
                  className="mb-6"
                />
                <p className="text-sm text-muted-foreground mb-6">
                  At {fmt(renterBudget)}/mo you could access <span className="font-semibold text-foreground">{renterListingCount} urgent listings</span> in Boston right now
                </p>
                <Button
                  onClick={() => navigate(`/urgent?maxprice=${renterBudget}`)}
                  className="w-full rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold"
                >
                  Show me these listings
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Subletter slider */}
            <Card className="shadow-sm">
              <CardContent className="p-8">
                <p className="text-sm font-medium text-muted-foreground mb-2">My current rent</p>
                <p className="text-4xl font-bold text-amber-600 mb-6">{fmt(subletterRent)}</p>
                <Slider
                  value={[subletterRent]}
                  onValueChange={(v) => setSubletterRent(v[0])}
                  min={500}
                  max={5000}
                  step={50}
                  className="mb-6"
                />
                <p className="text-sm text-muted-foreground mb-6">
                  If you drop to <span className="font-semibold text-foreground">{fmt(subletterDrop)}</span> you could fill your apartment in under a week
                </p>
                <Button
                  onClick={() => navigate("/listings/create")}
                  variant="outline"
                  className="w-full rounded-full border-amber-500 text-amber-600 hover:bg-amber-50 font-semibold"
                >
                  List my apartment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ════════ 6. TRUST & SAFETY ════════ */}
      <section className="bg-white py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-foreground mb-14">Safe, verified, and protected</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Verified identities", desc: "Every renter and subletter is identity verified before any transaction" },
              { icon: FileText, title: "Digital agreements", desc: "Legally binding sublet agreements generated and signed in the platform" },
              { icon: CreditCard, title: "Secure payments", desc: "All payments processed through Stripe. Your money is protected until move-in is confirmed" },
            ].map((t) => (
              <div key={t.title} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#7C3AED]/10">
                  <t.icon className="h-6 w-6 text-[#7C3AED]" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{t.title}</h3>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ 7. FINAL CTA ════════ */}
      <section
        className="py-20 px-6"
        style={{ background: "linear-gradient(135deg, #1a0e05 0%, #2d1a0a 50%, #1a0e05 100%)" }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8">Ready to make a move?</h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Button
              size="lg"
              onClick={() => navigate("/urgent")}
              className="rounded-full bg-white text-[#1a0e05] hover:bg-white/90 px-8 py-6 text-base font-semibold"
            >
              Find a summer place
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/listings/create")}
              className="rounded-full border-white/40 text-white hover:bg-white/10 px-8 py-6 text-base font-semibold"
            >
              Sublet my apartment
            </Button>
          </div>
          <p className="text-sm text-[rgba(255,235,210,0.7)]">
            No commitment. No listing fees. Just faster subletting.
          </p>
        </div>
      </section>
    </div>
  );
};

export default UrgentLandingPage;
