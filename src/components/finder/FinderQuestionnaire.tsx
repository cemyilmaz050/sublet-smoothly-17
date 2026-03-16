import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { FinderAnswers } from "./types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, addMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  onComplete: (answers: FinderAnswers) => void;
}

const TOTAL_STEPS = 7;

const universities = [
  "Northeastern University", "Boston University", "MIT", "Harvard University",
  "Tufts University", "Boston College", "Suffolk University", "Emerson College",
];

const companies = [
  "Fidelity Investments", "Wayfair", "Moderna", "Boston Consulting Group",
  "Mass General Hospital", "HubSpot", "Raytheon", "Bain & Company",
];

const priorityOptions = [
  { label: "Close to campus", icon: "🎓" },
  { label: "Close to work", icon: "💼" },
  { label: "Furnished", icon: "🛋️" },
  { label: "Utilities included", icon: "💡" },
  { label: "Laundry in building", icon: "👕" },
  { label: "Pet friendly", icon: "🐾" },
  { label: "Private bathroom", icon: "🚿" },
  { label: "Parking", icon: "🅿️" },
  { label: "Fast WiFi", icon: "📶" },
  { label: "Quiet neighborhood", icon: "🌳" },
];

const dealbreakerOptions = [
  "No pets allowed is fine",
  "Must allow pets",
  "No smoking",
  "Must have AC",
  "Must be furnished",
  "None",
];

const FinderQuestionnaire = ({ onComplete }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [reason, setReason] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState("");
  const [moveIn, setMoveIn] = useState<Date | undefined>();
  const [moveOut, setMoveOut] = useState<Date | undefined>();
  const [datePreset, setDatePreset] = useState("");
  const [budget, setBudget] = useState([1500]);
  const [occupants, setOccupants] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [dealbreakers, setDealbreakers] = useState<string[]>([]);

  const progress = ((currentStep + 1) / TOTAL_STEPS) * 100;

  const next = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onComplete({
        reason,
        locations,
        moveIn: moveIn ? format(moveIn, "yyyy-MM-dd") : "",
        moveOut: moveOut ? format(moveOut, "yyyy-MM-dd") : "",
        datePreset,
        budgetMin: 0,
        budgetMax: budget[0],
        occupants,
        priorities,
        dealbreakers,
      });
    }
  }, [currentStep, reason, locations, moveIn, moveOut, datePreset, budget, occupants, priorities, dealbreakers, onComplete]);

  const back = () => setCurrentStep((s) => Math.max(0, s - 1));

  const handleDatePreset = (preset: string) => {
    setDatePreset(preset);
    const year = new Date().getFullYear();
    if (preset === "may-aug") { setMoveIn(new Date(year, 4, 1)); setMoveOut(new Date(year, 7, 31)); }
    else if (preset === "jun-aug") { setMoveIn(new Date(year, 5, 1)); setMoveOut(new Date(year, 7, 31)); }
    else if (preset === "jul-aug") { setMoveIn(new Date(year, 6, 1)); setMoveOut(new Date(year, 7, 31)); }
    else { setDatePreset("custom"); }
  };

  const toggleLocation = (loc: string) => {
    setLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const togglePriority = (p: string) => {
    setPriorities((prev) => {
      if (prev.includes(p)) return prev.filter((x) => x !== p);
      if (prev.length >= 3) return prev;
      return [...prev, p];
    });
  };

  const toggleDealbreaker = (d: string) => {
    if (d === "None") {
      setDealbreakers(["None"]);
      return;
    }
    setDealbreakers((prev) => {
      const filtered = prev.filter((x) => x !== "None");
      return filtered.includes(d) ? filtered.filter((x) => x !== d) : [...filtered, d];
    });
  };

  const isInternship = reason === "Internship";
  const locationsList = isInternship
    ? [...companies, ...universities]
    : [...universities, ...companies];
  const filteredLocations = locationSearch
    ? locationsList.filter((l) => l.toLowerCase().includes(locationSearch.toLowerCase()))
    : locationsList;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return !!reason;
      case 1: return locations.length > 0;
      case 2: return !!moveIn && !!moveOut;
      case 3: return true;
      case 4: return !!occupants;
      case 5: return priorities.length > 0;
      case 6: return dealbreakers.length > 0;
      default: return false;
    }
  };

  const weeklyRent = Math.round(budget[0] / 4.33);

  const slideVariants = {
    enter: { opacity: 0, x: 60 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -60 },
  };

  const OptionButton = ({ label, selected, onClick, emoji }: { label: string; selected: boolean; onClick: () => void; emoji?: string }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border-2 px-5 py-4 text-left text-base font-medium transition-all",
        selected
          ? "border-primary bg-primary/10 text-foreground shadow-sm"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/50"
      )}
    >
      {emoji && <span className="mr-2">{emoji}</span>}
      {label}
    </motion.button>
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Progress bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between mb-2">
            {currentStep > 0 && (
              <button onClick={back} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            )}
            <span className="ml-auto text-sm text-muted-foreground">
              {currentStep + 1} of {TOTAL_STEPS}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      {/* Question content */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              {/* Step 1: Reason */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">What brings you to Boston this summer? ☀️</h1>
                    <p className="mt-2 text-muted-foreground">This helps us find the right neighborhood for you</p>
                  </div>
                  <div className="space-y-3">
                    {["Internship", "University program", "Summer classes", "Research", "Just exploring", "Other"].map((opt) => (
                      <OptionButton key={opt} label={opt} selected={reason === opt} onClick={() => setReason(opt)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      {isInternship ? "Which company will you be at?" : "Which school will you be near?"} 🏫
                    </h1>
                    <p className="mt-2 text-muted-foreground">Select one or more — we'll find places nearby</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                    {filteredLocations.map((loc) => (
                      <OptionButton
                        key={loc}
                        label={loc}
                        selected={locations.includes(loc)}
                        onClick={() => toggleLocation(loc)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Dates */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">When do you need the place? 📅</h1>
                    <p className="mt-2 text-muted-foreground">Pick your dates or choose a quick option</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "May → Aug", value: "may-aug" },
                      { label: "Jun → Aug", value: "jun-aug" },
                      { label: "Jul → Aug", value: "jul-aug" },
                      { label: "Custom dates", value: "custom" },
                    ].map((opt) => (
                      <OptionButton
                        key={opt.value}
                        label={opt.label}
                        selected={datePreset === opt.value}
                        onClick={() => handleDatePreset(opt.value)}
                      />
                    ))}
                  </div>
                  {datePreset === "custom" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Move in</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left", !moveIn && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {moveIn ? format(moveIn, "MMM d, yyyy") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={moveIn} onSelect={setMoveIn} className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Move out</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left", !moveOut && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {moveOut ? format(moveOut, "MMM d, yyyy") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={moveOut} onSelect={setMoveOut} className="p-3 pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                  {moveIn && moveOut && (
                    <p className="text-sm text-muted-foreground text-center">
                      {format(moveIn, "MMM d")} → {format(moveOut, "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              )}

              {/* Step 4: Budget */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">What's your budget per month? 💰</h1>
                    <p className="mt-2 text-muted-foreground">Drag the slider or pick a quick range</p>
                  </div>
                  <div className="space-y-6">
                    <div className="text-center">
                      <span className="text-5xl font-bold text-primary">${budget[0].toLocaleString()}</span>
                      <span className="text-lg text-muted-foreground">/mo</span>
                      <p className="mt-1 text-sm text-muted-foreground">≈ ${weeklyRent}/week</p>
                    </div>
                    <Slider
                      value={budget}
                      onValueChange={setBudget}
                      min={500}
                      max={5000}
                      step={50}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>$500</span>
                      <span>$5,000</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Under $1,000", value: 1000 },
                      { label: "$1,000 – $1,500", value: 1500 },
                      { label: "$1,500 – $2,000", value: 2000 },
                      { label: "$2,000+", value: 3000 },
                    ].map((opt) => (
                      <OptionButton
                        key={opt.label}
                        label={opt.label}
                        selected={budget[0] === opt.value}
                        onClick={() => setBudget([opt.value])}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Occupants */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">How many people are staying? 👥</h1>
                    <p className="mt-2 text-muted-foreground">This helps us find the right size place</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Just me", emoji: "🙋" },
                      { label: "Me and one roommate", emoji: "👥" },
                      { label: "Me and two roommates", emoji: "👥👤" },
                    ].map((opt) => (
                      <OptionButton
                        key={opt.label}
                        label={opt.label}
                        emoji={opt.emoji}
                        selected={occupants === opt.label}
                        onClick={() => setOccupants(opt.label)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 6: Priorities */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">What matters most to you? ✨</h1>
                    <p className="mt-2 text-muted-foreground">Pick up to 3 — we'll weight your results</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {priorityOptions.map((opt) => (
                      <OptionButton
                        key={opt.label}
                        label={opt.label}
                        emoji={opt.icon}
                        selected={priorities.includes(opt.label)}
                        onClick={() => togglePriority(opt.label)}
                      />
                    ))}
                  </div>
                  {priorities.length > 0 && (
                    <p className="text-sm text-center text-muted-foreground">
                      {priorities.length}/3 selected
                    </p>
                  )}
                </div>
              )}

              {/* Step 7: Dealbreakers */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Any deal breakers? 🚫</h1>
                    <p className="mt-2 text-muted-foreground">We'll filter out anything that doesn't work</p>
                  </div>
                  <div className="space-y-3">
                    {dealbreakerOptions.map((opt) => (
                      <OptionButton
                        key={opt}
                        label={opt}
                        selected={dealbreakers.includes(opt)}
                        onClick={() => toggleDealbreaker(opt)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Continue button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <Button
              variant="hero"
              size="xl"
              className="w-full"
              onClick={next}
              disabled={!canProceed()}
            >
              {currentStep === TOTAL_STEPS - 1 ? "Find my place 🏠" : "Continue"}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default FinderQuestionnaire;
