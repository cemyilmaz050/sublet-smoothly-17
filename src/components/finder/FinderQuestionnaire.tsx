import { useState, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Search, Briefcase, GraduationCap, Home, DoorOpen, Users,
  MapPin, Building2, Sofa, Zap, WashingMachine, PawPrint, Car, Wifi,
  Moon, Shield, CalendarIcon, CircleDollarSign, User, UserPlus,
  Ban, Snowflake, CigaretteOff, Check, Minus, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { FinderAnswers } from "./types";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
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

const reasonOptions: { label: string; icon: ReactNode }[] = [
  { label: "Internship", icon: <Briefcase className="h-5 w-5" /> },
  { label: "University program", icon: <GraduationCap className="h-5 w-5" /> },
  { label: "Summer classes", icon: <GraduationCap className="h-5 w-5" /> },
  { label: "Research", icon: <Search className="h-5 w-5" /> },
  { label: "Just exploring", icon: <MapPin className="h-5 w-5" /> },
  { label: "Other", icon: <Home className="h-5 w-5" /> },
];

const priorityOptions: { label: string; icon: ReactNode }[] = [
  { label: "Close to campus", icon: <MapPin className="h-5 w-5" /> },
  { label: "Close to work", icon: <Building2 className="h-5 w-5" /> },
  { label: "Furnished", icon: <Sofa className="h-5 w-5" /> },
  { label: "Utilities included", icon: <Zap className="h-5 w-5" /> },
  { label: "Laundry in building", icon: <WashingMachine className="h-5 w-5" /> },
  { label: "Pet friendly", icon: <PawPrint className="h-5 w-5" /> },
  { label: "Parking", icon: <Car className="h-5 w-5" /> },
  { label: "Fast WiFi", icon: <Wifi className="h-5 w-5" /> },
  { label: "Quiet neighborhood", icon: <Moon className="h-5 w-5" /> },
];

const dealbreakerOptions: { label: string; icon: ReactNode }[] = [
  { label: "No pets allowed is fine", icon: <PawPrint className="h-5 w-5" /> },
  { label: "Must allow pets", icon: <PawPrint className="h-5 w-5" /> },
  { label: "No smoking", icon: <CigaretteOff className="h-5 w-5" /> },
  { label: "Must have AC", icon: <Snowflake className="h-5 w-5" /> },
  { label: "Must be furnished", icon: <Sofa className="h-5 w-5" /> },
  { label: "None", icon: <Ban className="h-5 w-5" /> },
];

const occupantOptions: { label: string; icon: ReactNode }[] = [
  { label: "Just me", icon: <User className="h-5 w-5" /> },
  { label: "Me and one roommate", icon: <Users className="h-5 w-5" /> },
  { label: "Me and two roommates", icon: <UserPlus className="h-5 w-5" /> },
];

/* ─── Shared option card ─── */
const OptionCard = ({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  icon?: ReactNode;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition-all",
      selected
        ? "border-foreground bg-muted shadow-sm"
        : "border-border bg-card hover:border-muted-foreground/40"
    )}
  >
    <span className="text-[15px] font-medium text-foreground">{label}</span>
    {icon && (
      <span className={cn("text-muted-foreground", selected && "text-foreground")}>
        {icon}
      </span>
    )}
  </button>
);

/* ─── Main component ─── */
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

  const toggleLocation = (loc: string) =>
    setLocations((prev) => prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]);

  const togglePriority = (p: string) =>
    setPriorities((prev) => {
      if (prev.includes(p)) return prev.filter((x) => x !== p);
      if (prev.length >= 3) return prev;
      return [...prev, p];
    });

  const toggleDealbreaker = (d: string) => {
    if (d === "None") { setDealbreakers(["None"]); return; }
    setDealbreakers((prev) => {
      const filtered = prev.filter((x) => x !== "None");
      return filtered.includes(d) ? filtered.filter((x) => x !== d) : [...filtered, d];
    });
  };

  const isInternship = reason === "Internship";
  const locationsList = isInternship ? [...companies, ...universities] : [...universities, ...companies];
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
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center">
          {currentStep > 0 ? (
            <button onClick={back} className="p-1 -ml-1 text-foreground hover:text-foreground/70 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="w-5" />
          )}
          <span className="mx-auto text-sm font-medium text-muted-foreground">
            Step {currentStep + 1} of {TOTAL_STEPS}
          </span>
          <div className="w-5" />
        </div>
        <div className="mx-auto max-w-lg mt-2">
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-5 pt-8 pb-32">
        <div className="mx-auto w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Step 1 — Reason */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground leading-tight">
                      What brings you to Boston this summer?
                    </h1>
                    <p className="mt-2 text-muted-foreground text-[15px]">
                      This helps us find the right neighborhood for you
                    </p>
                  </div>
                  <div className="space-y-3">
                    {reasonOptions.map((opt) => (
                      <OptionCard
                        key={opt.label}
                        label={opt.label}
                        icon={opt.icon}
                        selected={reason === opt.label}
                        onClick={() => setReason(opt.label)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2 — Location */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground leading-tight">
                      {isInternship ? "Which company will you be at?" : "Which school will you be near?"}
                    </h1>
                    <p className="mt-2 text-muted-foreground text-[15px]">
                      Select one or more — we'll find places nearby
                    </p>
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
                      <OptionCard
                        key={loc}
                        label={loc}
                        icon={<Shield className="h-5 w-5" />}
                        selected={locations.includes(loc)}
                        onClick={() => toggleLocation(loc)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 — Dates */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground leading-tight">
                      When do you need the place?
                    </h1>
                    <p className="mt-2 text-muted-foreground text-[15px]">
                      Pick your dates or choose a quick option
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "May – Aug", value: "may-aug" },
                      { label: "Jun – Aug", value: "jun-aug" },
                      { label: "Jul – Aug", value: "jul-aug" },
                      { label: "Custom dates", value: "custom" },
                    ].map((opt) => (
                      <OptionCard
                        key={opt.value}
                        label={opt.label}
                        icon={<CalendarIcon className="h-5 w-5" />}
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
                      {format(moveIn, "MMM d")} – {format(moveOut, "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              )}

              {/* Step 4 — Budget */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground leading-tight">
                      What's your budget per month?
                    </h1>
                    <p className="mt-2 text-muted-foreground text-[15px]">
                      Drag the slider or pick a quick range
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div className="text-center">
                      <span className="text-5xl font-semibold text-foreground">${budget[0].toLocaleString()}</span>
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
                      <OptionCard
                        key={opt.label}
                        label={opt.label}
                        icon={<CircleDollarSign className="h-5 w-5" />}
                        selected={budget[0] === opt.value}
                        onClick={() => setBudget([opt.value])}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5 — Occupants */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground leading-tight">
                      How many people are staying?
                    </h1>
                    <p className="mt-2 text-muted-foreground text-[15px]">
                      This helps us find the right size place
                    </p>
                  </div>
                  <div className="space-y-3">
                    {occupantOptions.map((opt) => (
                      <OptionCard
                        key={opt.label}
                        label={opt.label}
                        icon={opt.icon}
                        selected={occupants === opt.label}
                        onClick={() => setOccupants(opt.label)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Step 6 — Priorities */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground leading-tight">
                      What matters most to you?
                    </h1>
                    <p className="mt-2 text-muted-foreground text-[15px]">
                      Pick up to 3 — we'll weight your results
                    </p>
                  </div>
                  <div className="space-y-3">
                    {priorityOptions.map((opt) => (
                      <OptionCard
                        key={opt.label}
                        label={opt.label}
                        icon={opt.icon}
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

              {/* Step 7 — Dealbreakers */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground leading-tight">
                      Any deal breakers?
                    </h1>
                    <p className="mt-2 text-muted-foreground text-[15px]">
                      We'll filter out anything that doesn't work
                    </p>
                  </div>
                  <div className="space-y-3">
                    {dealbreakerOptions.map((opt) => (
                      <OptionCard
                        key={opt.label}
                        label={opt.label}
                        icon={opt.icon}
                        selected={dealbreakers.includes(opt.label)}
                        onClick={() => toggleDealbreaker(opt.label)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background px-5 py-4">
        <div className="mx-auto max-w-lg">
          <Button
            className={cn(
              "w-full rounded-xl py-6 text-base font-semibold transition-all",
              canProceed()
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            onClick={next}
            disabled={!canProceed()}
          >
            {currentStep === TOTAL_STEPS - 1 ? "Find my place" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinderQuestionnaire;
