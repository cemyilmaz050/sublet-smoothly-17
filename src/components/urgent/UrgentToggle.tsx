import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Zap } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ListingFormData } from "@/types/listing";

interface Props {
  data: ListingFormData;
  onChange: (data: Partial<ListingFormData>) => void;
}

const URGENCY_REASONS = [
  { value: "traveling", label: "Traveling for work" },
  { value: "study_abroad", label: "Study abroad" },
  { value: "family_emergency", label: "Family emergency" },
  { value: "summer_vacancy", label: "Summer vacancy" },
  { value: "other", label: "Other" },
];

const UrgentToggle = ({ data, onChange }: Props) => {
  const deadlineDate = data.urgency_deadline ? new Date(data.urgency_deadline) : undefined;

  return (
    <div className="mt-6 rounded-xl border-2 border-dashed border-amber-400/50 bg-amber-50/50 dark:bg-amber-950/20 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-500" />
          <div>
            <Label className="text-base font-semibold">Mark as Urgent Sublet</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Urgent listings get priority visibility and allow price negotiation.
            </p>
          </div>
        </div>
        <Switch
          checked={data.is_urgent}
          onCheckedChange={(checked) => onChange({ is_urgent: checked })}
        />
      </div>

      {data.is_urgent && (
        <div className="space-y-4 pt-2 border-t border-amber-200/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="asking_price">Asking Price ($/mo) *</Label>
              <Input
                id="asking_price"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="1800"
                className="mt-1.5 text-base"
                value={data.asking_price}
                onChange={(e) => onChange({ asking_price: e.target.value ? Number(e.target.value) : "" })}
              />
              <p className="text-xs text-muted-foreground mt-1">Shown publicly to subtenants</p>
            </div>
            <div>
              <Label htmlFor="minimum_price">Minimum Acceptable Price ($/mo) *</Label>
              <Input
                id="minimum_price"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="1500"
                className="mt-1.5 text-base"
                value={data.minimum_price}
                onChange={(e) => onChange({ minimum_price: e.target.value ? Number(e.target.value) : "" })}
              />
              <p className="text-xs text-muted-foreground mt-1">Private — never shown to subtenants</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Urgency Reason</Label>
              <Select value={data.urgency_reason} onValueChange={(v) => onChange({ urgency_reason: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select reason (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>I need this filled by *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("mt-1.5 w-full justify-start text-left font-normal", !deadlineDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadlineDate ? format(deadlineDate, "PPP") : "Pick deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                  <Calendar
                    mode="single"
                    selected={deadlineDate}
                    onSelect={(d) => d && onChange({ urgency_deadline: d.toISOString() })}
                    disabled={(d) => d < new Date(new Date().toDateString())}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrgentToggle;
