import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListingFormData, AMENITIES_LIST, GUEST_POLICIES } from "@/types/listing";

interface Props {
  data: ListingFormData;
  onChange: (data: Partial<ListingFormData>) => void;
  errors: Record<string, string>;
}

const ListingStep4 = ({ data, onChange, errors }: Props) => {
  const toggleAmenity = (amenity: string) => {
    const updated = data.amenities.includes(amenity)
      ? data.amenities.filter((a) => a !== amenity)
      : [...data.amenities, amenity];
    onChange({ amenities: updated });
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-foreground">House Rules & Amenities</h2>

      <div>
        <Label>Amenities</Label>
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AMENITIES_LIST.map((amenity) => (
            <label key={amenity} className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50 min-h-[48px]">
              <Checkbox
                checked={data.amenities.includes(amenity)}
                onCheckedChange={() => toggleAmenity(amenity)}
                className="h-5 w-5"
              />
              <span className="text-sm text-foreground">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="rules">House Rules ({data.house_rules.length}/300)</Label>
        <Textarea
          id="rules"
          placeholder="e.g. No loud music after 10pm, take out trash on Tuesdays..."
          maxLength={300}
          rows={3}
          className="mt-1.5 text-base"
          value={data.house_rules}
          onChange={(e) => onChange({ house_rules: e.target.value })}
        />
      </div>

      <div>
        <Label>Guest Policy *</Label>
        <Select value={data.guest_policy} onValueChange={(v) => onChange({ guest_policy: v as any })}>
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Select guest policy" />
          </SelectTrigger>
          <SelectContent>
            {GUEST_POLICIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.guest_policy && <p className="mt-1 text-sm text-destructive">{errors.guest_policy}</p>}
      </div>
    </div>
  );
};

export default ListingStep4;
