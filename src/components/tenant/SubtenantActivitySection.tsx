import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MessageSquare, Users, Calendar as CalIcon } from "lucide-react";

interface ListingData {
  id: string;
  headline: string | null;
  available_from: string | null;
  available_until: string | null;
  status: string;
}

interface Props {
  listings: ListingData[];
}

const SubtenantActivitySection = ({ listings }: Props) => {
  const [calMonth, setCalMonth] = useState(new Date());

  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay();

  // Build availability map from listings
  const dayStatus = useMemo(() => {
    const map: Record<number, "available" | "applied" | "confirmed"> = {};
    for (const listing of listings) {
      if (!listing.available_from || !listing.available_until) continue;
      const from = new Date(listing.available_from);
      const until = new Date(listing.available_until);
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        if (date >= from && date <= until) {
          if (!map[d]) {
            map[d] = listing.status === "active" ? "available" : "available";
          }
        }
      }
    }
    return map;
  }, [listings, year, month, daysInMonth]);

  const prevMonth = () => setCalMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCalMonth(new Date(year, month + 1, 1));

  const dayColorClass: Record<string, string> = {
    available: "bg-primary/15 text-primary font-medium",
    applied: "bg-amber/15 text-amber font-medium",
    confirmed: "bg-emerald/15 text-emerald font-medium",
  };

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-foreground">Subtenant Activity</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Interested Subtenants */}
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground text-sm">
            <Users className="h-4 w-4 text-primary" />
            Interested Subtenants
          </h3>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No interested subtenants yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Activity from saves, applications, and messages will appear here
            </p>
          </div>
        </div>

        {/* Right: Calendar */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-foreground text-sm">
              <CalIcon className="h-4 w-4 text-primary" />
              Availability Calendar
            </h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[120px] text-center text-sm font-medium text-foreground">
                {calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const status = dayStatus[day];
              return (
                <div
                  key={day}
                  className={`flex h-8 w-full items-center justify-center rounded-md text-xs transition-colors ${
                    status ? dayColorClass[status] : "text-muted-foreground hover:bg-muted/50"
                  }`}
                  title={status ? `${status} — Day ${day}` : undefined}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary/40" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber/40" />
              Applied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald/40" />
              Confirmed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubtenantActivitySection;
