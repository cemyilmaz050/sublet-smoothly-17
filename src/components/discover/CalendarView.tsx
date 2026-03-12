import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ListingItem {
  id: string;
  headline: string | null;
  address: string | null;
  monthly_rent: number | null;
  available_from: string | null;
  available_until: string | null;
  property_type?: string | null;
}

interface Props {
  listings: ListingItem[];
  onDayClick: (dateStr: string) => void;
  selectedDate: string | null;
}

const DATE_CHIPS = [
  { label: "This Weekend", key: "weekend" },
  { label: "Next Month", key: "next_month" },
  { label: "1–3 Months", key: "1_3" },
  { label: "3–6 Months", key: "3_6" },
  { label: "Custom Range", key: "custom" },
];

const CalendarView = ({ listings, onDayClick, selectedDate }: Props) => {
  const [baseMonth, setBaseMonth] = useState(new Date());
  const [activeChip, setActiveChip] = useState<string | null>(null);

  const prevMonth = () => setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() - 1, 1));
  const nextMonth = () => setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1));

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleChipClick = (key: string) => {
    setActiveChip(activeChip === key ? null : key);
    const now = new Date();
    if (key === "weekend") {
      const day = now.getDay();
      const sat = new Date(now);
      sat.setDate(now.getDate() + (6 - day));
      onDayClick(sat.toISOString().slice(0, 10));
    } else if (key === "next_month") {
      const nm = new Date(now.getFullYear(), now.getMonth() + 1, 15);
      onDayClick(nm.toISOString().slice(0, 10));
    }
  };

  // Count listings per day for both months
  const getMonthData = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow = new Date(year, month, 1).getDay();
    const dayCounts: Record<number, { total: number; types: Set<string> }> = {};

    for (const listing of listings) {
      if (!listing.available_from || !listing.available_until) continue;
      const from = new Date(listing.available_from);
      const until = new Date(listing.available_until);
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        if (date >= from && date <= until) {
          if (!dayCounts[d]) dayCounts[d] = { total: 0, types: new Set() };
          dayCounts[d].total++;
          if (listing.property_type) dayCounts[d].types.add(listing.property_type);
        }
      }
    }

    return { daysInMonth, firstDow, dayCounts };
  };

  const month1 = baseMonth;
  const month2 = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1);

  const renderMonth = (date: Date) => {
    const { daysInMonth, firstDow, dayCounts } = getMonthData(date.getFullYear(), date.getMonth());

    const typeColor: Record<string, string> = {
      apartment: "bg-primary",
      house: "bg-emerald",
      studio: "bg-amber",
      condo: "bg-cyan",
    };

    return (
      <div>
        <h4 className="mb-3 text-center text-sm font-semibold text-foreground">
          {date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h4>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {dayNames.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-0.5">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const info = dayCounts[day];
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={day}
                onClick={() => onDayClick(dateStr)}
                className={`relative flex h-9 w-full flex-col items-center justify-center rounded-md text-xs transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground ring-2 ring-primary"
                    : info
                    ? "bg-primary/10 text-foreground hover:bg-primary/20"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {day}
                {info && (
                  <div className="absolute bottom-0.5 flex gap-0.5">
                    {Array.from(info.types).slice(0, 3).map((type) => (
                      <span
                        key={type}
                        className={`h-1 w-1 rounded-full ${typeColor[type] || "bg-primary"}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 lg:p-6">
      {/* Quick date chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        {DATE_CHIPS.map((chip) => (
          <Button
            key={chip.key}
            variant={activeChip === chip.key ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => handleChipClick(chip.key)}
          >
            {chip.label}
          </Button>
        ))}
      </div>

      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Two months side by side */}
      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        {renderMonth(month1)}
        {renderMonth(month2)}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 border-t pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" /> Apartments
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald" /> Houses
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber" /> Studios
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan" /> Condos
        </span>
      </div>
    </div>
  );
};

export default CalendarView;
