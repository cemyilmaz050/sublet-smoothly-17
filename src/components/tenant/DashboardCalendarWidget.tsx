import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ListingDates {
  available_from: string | null;
  available_until: string | null;
  status: string;
}

interface Props {
  listings: ListingDates[];
}

const DashboardCalendarWidget = ({ listings }: Props) => {
  const [monthOffset, setMonthOffset] = useState(0);
  const baseDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = baseDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const getDayStatus = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const d = new Date(dateStr);
    for (const l of listings) {
      if (!l.available_from || !l.available_until) continue;
      const from = new Date(l.available_from);
      const until = new Date(l.available_until);
      if (d >= from && d <= until) {
        if (l.status === "active") return "available";
        if (l.status === "pending") return "applied";
      }
    }
    return null;
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Calendar</h2>
        <Button variant="ghost" size="sm" className="text-primary text-sm">View Full Calendar</Button>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => setMonthOffset((o) => o - 1)} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="text-sm font-semibold text-foreground">{monthName}</p>
            <button onClick={() => setMonthOffset((o) => o + 1)} className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="py-1 text-xs font-medium text-muted-foreground">{d}</div>
            ))}
            {days.map((day, i) => {
              if (!day) return <div key={i} />;
              const status = getDayStatus(day);
              return (
                <div
                  key={i}
                  className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                    status === "available" ? "bg-accent text-accent-foreground" :
                    status === "applied" ? "bg-amber/20 text-amber" :
                    "text-foreground"
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-accent" />Available</span>
            <span className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-amber/40" />Applied</span>
            <span className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-emerald/40" />Confirmed</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCalendarWidget;
