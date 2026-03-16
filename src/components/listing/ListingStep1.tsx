import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListingFormData, PROPERTY_TYPES } from "@/types/listing";

interface Props {
  data: ListingFormData;
  onChange: (data: Partial<ListingFormData>) => void;
  errors: Record<string, string>;
}

const ListingStep1 = ({ data, onChange, errors }: Props) => {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-foreground">About your place 🏠</h2>
      <div>
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          placeholder="123 Main St, Boston, MA"
          className="mt-1.5"
          value={data.address}
          onChange={(e) => onChange({ address: e.target.value })}
        />
        {errors.address && <p className="mt-1 text-sm text-destructive">{errors.address}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="unit">Unit Number</Label>
          <Input
            id="unit"
            placeholder="e.g. 4B"
            className="mt-1.5"
            value={data.unit_number}
            onChange={(e) => onChange({ unit_number: e.target.value })}
          />
        </div>
        <div>
          <Label>Type *</Label>
          <Select value={data.property_type} onValueChange={(v) => onChange({ property_type: v as any })}>
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.property_type && <p className="mt-1 text-sm text-destructive">{errors.property_type}</p>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="bedrooms">Bedrooms *</Label>
          <Input id="bedrooms" type="number" min={0} placeholder="2" className="mt-1.5"
            value={data.bedrooms} onChange={(e) => onChange({ bedrooms: e.target.value ? Number(e.target.value) : "" })} />
          {errors.bedrooms && <p className="mt-1 text-sm text-destructive">{errors.bedrooms}</p>}
        </div>
        <div>
          <Label htmlFor="bathrooms">Bathrooms *</Label>
          <Input id="bathrooms" type="number" min={0} placeholder="1" className="mt-1.5"
            value={data.bathrooms} onChange={(e) => onChange({ bathrooms: e.target.value ? Number(e.target.value) : "" })} />
          {errors.bathrooms && <p className="mt-1 text-sm text-destructive">{errors.bathrooms}</p>}
        </div>
        <div>
          <Label htmlFor="sqft">Sq Ft</Label>
          <Input id="sqft" type="number" min={0} placeholder="750" className="mt-1.5"
            value={data.sqft} onChange={(e) => onChange({ sqft: e.target.value ? Number(e.target.value) : "" })} />
        </div>
      </div>
    </div>
  );
};

export default ListingStep1;
