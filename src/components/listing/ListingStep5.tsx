import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Pencil } from "lucide-react";
import { ListingFormData, GUEST_POLICIES, PROPERTY_TYPES } from "@/types/listing";
import { format } from "date-fns";

interface Props {
  data: ListingFormData;
  confirmed: boolean;
  onConfirmChange: (v: boolean) => void;
  onGoToStep: (step: number) => void;
}

const Section = ({ title, step, onEdit, children }: { title: string; step: number; onEdit: (s: number) => void; children: React.ReactNode }) => (
  <div>
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <Button variant="ghost" size="sm" onClick={() => onEdit(step)}>
        <Pencil className="mr-1 h-3 w-3" /> Edit
      </Button>
    </div>
    <div className="mt-2 space-y-1 text-sm text-muted-foreground">{children}</div>
  </div>
);

const ListingStep5 = ({ data, confirmed, onConfirmChange, onGoToStep }: Props) => {
  const propType = PROPERTY_TYPES.find((t) => t.value === data.property_type)?.label || data.property_type;
  const guestLabel = GUEST_POLICIES.find((p) => p.value === data.guest_policy)?.label || data.guest_policy;
  const totalPhotos = data.photoUrls.length + data.photos.length;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-foreground">Review & Submit</h2>

      <Section title="Property Basics" step={0} onEdit={onGoToStep}>
        <p><strong>Address:</strong> {data.address} {data.unit_number && `(Unit ${data.unit_number})`}</p>
        <p><strong>Type:</strong> {propType} — {data.bedrooms} bed, {data.bathrooms} bath{data.sqft ? `, ${data.sqft} sqft` : ""}</p>
      </Section>

      <Separator />

      <Section title="Photos & Description" step={1} onEdit={onGoToStep}>
        <p><strong>Photos:</strong> {totalPhotos} uploaded</p>
        <p><strong>Headline:</strong> {data.headline}</p>
        <p><strong>Description:</strong> {data.description}</p>
      </Section>

      <Separator />

      <Section title="Pricing & Availability" step={2} onEdit={onGoToStep}>
        <p><strong>Rent:</strong> ${data.monthly_rent}/mo — <strong>Deposit:</strong> ${data.security_deposit}</p>
        <p><strong>Available:</strong> {data.available_from && format(new Date(data.available_from), "PPP")} → {data.available_until && format(new Date(data.available_until), "PPP")}</p>
        <p><strong>Min duration:</strong> {data.min_duration} month(s)</p>
      </Section>

      <Separator />

      <Section title="House Rules & Amenities" step={3} onEdit={onGoToStep}>
        <div className="flex flex-wrap gap-1.5">
          {data.amenities.map((a) => (
            <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
          ))}
        </div>
        {data.house_rules && <p className="mt-1"><strong>Rules:</strong> {data.house_rules}</p>}
        <p><strong>Guest policy:</strong> {guestLabel}</p>
      </Section>

      <Separator />

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4">
        <Checkbox checked={confirmed} onCheckedChange={(v) => onConfirmChange(!!v)} className="mt-0.5" />
        <span className="text-sm text-foreground">
          I confirm all information is accurate and I have manager approval to sublet this property.
        </span>
      </label>
    </div>
  );
};

export default ListingStep5;
