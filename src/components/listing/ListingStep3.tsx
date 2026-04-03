import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ListingFormData, MIN_DURATIONS } from "@/types/listing";
import UrgentToggle from "@/components/urgent/UrgentToggle";

interface Props {
  data: ListingFormData;
  onChange: (data: Partial<ListingFormData>) => void;
  errors: Record<string, string>;
}

const ListingStep3 = ({ data, onChange, errors }: Props) => {
  const fromDate = data.available_from ? new Date(data.available_from) : undefined;
  const untilDate = data.available_until ? new Date(data.available_until) : undefined;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-foreground">Pricing & Availability</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rent">Monthly Rent ($) *</Label>
          <Input
            id="rent"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            placeholder="2500"
            className="mt-1.5 text-base"
            value={data.monthly_rent}
            onChange={(e) => onChange({ monthly_rent: e.target.value ? Number(e.target.value) : "" })}
          />
          {errors.monthly_rent && <p className="mt-1 text-sm text-destructive">{errors.monthly_rent}</p>}
        </div>
        <div>
          <Label htmlFor="deposit">Security Deposit ($) *</Label>
          <Input
            id="deposit"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min={0}
            placeholder="2500"
            className="mt-1.5 text-base"
            value={data.security_deposit}
            onChange={(e) => onChange({ security_deposit: e.target.value ? Number(e.target.value) : "" })}
          />
          {errors.security_deposit && <p className="mt-1 text-sm text-destructive">{errors.security_deposit}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Available From *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("mt-1.5 w-full justify-start text-left font-normal", !fromDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fromDate ? format(fromDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999]" align="start" side="bottom" avoidCollisions>
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={(d) => d && onChange({ available_from: format(d, "yyyy-MM-dd") })}
                disabled={(d) => d < new Date(new Date().toDateString())}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {errors.available_from && <p className="mt-1 text-sm text-destructive">{errors.available_from}</p>}
        </div>
        <div>
          <Label>Available Until *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("mt-1.5 w-full justify-start text-left font-normal", !untilDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {untilDate ? format(untilDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999]" align="start" side="bottom" avoidCollisions>
              <Calendar
                mode="single"
                selected={untilDate}
                onSelect={(d) => d && onChange({ available_until: format(d, "yyyy-MM-dd") })}
                disabled={(d) => fromDate ? d <= fromDate : d < new Date(new Date().toDateString())}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {errors.available_until && <p className="mt-1 text-sm text-destructive">{errors.available_until}</p>}
        </div>
      </div>
      <div>
        <Label>Minimum Sublet Duration *</Label>
        <Select value={String(data.min_duration)} onValueChange={(v) => onChange({ min_duration: Number(v) })}>
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MIN_DURATIONS.map((d) => (
              <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Urgent Sublet Toggle */}
      <UrgentToggle data={data} onChange={onChange} />
    </div>
  );
};

export default ListingStep3;
