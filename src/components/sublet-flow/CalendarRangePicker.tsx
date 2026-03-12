import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface CalendarRangePickerProps {
  availableFrom: string;
  availableUntil: string;
  onSelect: (from: string, until: string) => void;
}

const CalendarRangePicker = ({ availableFrom, availableUntil, onSelect }: CalendarRangePickerProps) => {
  const [baseMonth, setBaseMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const handleDayClick = (dateStr: string) => {
    if (!availableFrom || (availableFrom && availableUntil)) {
      onSelect(dateStr, "");
    } else {
      if (dateStr < availableFrom) {
        onSelect(dateStr, "");
      } else {
        onSelect(availableFrom, dateStr);
      }
    }
  };

  const renderMonth = (baseDate: Date) => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthName = baseDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    const fromDate = availableFrom ? new Date(availableFrom + "T00:00:00") : null;
    const untilDate = availableUntil ? new Date(availableUntil + "T00:00:00") : null;

    const isInRange = (day: number) => {
      if (!fromDate || !untilDate) return false;
      const d = new Date(year, month, day);
      return d > fromDate && d < untilDate;
    };
    const isStart = (day: number) => fromDate && year === fromDate.getFullYear() && month === fromDate.getMonth() && day === fromDate.getDate();
    const isEnd = (day: number) => untilDate && year === untilDate.getFullYear() && month === untilDate.getMonth() && day === untilDate.getDate();
    const isPast = (day: number) => {
      const d = new Date(year, month, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d < today;
    };

    return (
      <div className="flex-1 min-w-[260px]">
        <p className="mb-3 text-center text-sm font-semibold text-foreground">{monthName}</p>
        <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d} className="py-1 text-muted-foreground font-medium">{d}</div>
          ))}
          {days.map((day, i) => (
            <div key={i}>
              {day ? (
                <button
                  disabled={isPast(day)}
                  onClick={() => handleDayClick(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)}
                  className={`w-full rounded-md py-1.5 text-sm transition-colors
                    ${isPast(day) ? "text-muted-foreground/40 cursor-not-allowed" : ""}
                    ${isStart(day) || isEnd(day) ? "bg-primary text-primary-foreground font-semibold" : ""}
                    ${isInRange(day) ? "bg-accent text-accent-foreground" : ""}
                    ${!isPast(day) && !isStart(day) && !isEnd(day) && !isInRange(day) ? "hover:bg-muted" : ""}
                  `}
                >
                  {day}
                </button>
              ) : <div />}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const nextMonthDate = new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1);

  const formatRange = () => {
    if (!availableFrom || !availableUntil) return "";
    const from = new Date(availableFrom + "T00:00:00");
    const until = new Date(availableUntil + "T00:00:00");
    const months = Math.max(1, Math.round((until.getTime() - from.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    return `Available from ${from.toLocaleDateString("en-US", { month: "long", day: "numeric" })} to ${until.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · ${months} month${months !== 1 ? "s" : ""}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() - 1, 1))} className="rounded-full p-1 hover:bg-muted">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <button onClick={() => setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1))} className="rounded-full p-1 hover:bg-muted">
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
      <div className="flex gap-6 overflow-x-auto">
        {renderMonth(baseMonth)}
        {renderMonth(nextMonthDate)}
      </div>
      {formatRange() && (
        <p className="rounded-lg bg-accent px-4 py-2 text-center text-sm font-medium text-primary">{formatRange()}</p>
      )}
    </div>
  );
};

export default CalendarRangePicker;
