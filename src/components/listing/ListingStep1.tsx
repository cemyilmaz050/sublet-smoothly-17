import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListingFormData, PROPERTY_TYPES } from "@/types/listing";
import { Building2, User, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BBG_PROPERTIES = [
  "25 Iroquois St",
  "276 East Cottage #3",
  "276 East Cottage #1",
  "37 Harbor View #3",
  "26 Symphony #1",
  "81 Windsor",
  "15 Sunset #2",
  "118 Buttonwood #3 Room 1",
];

interface Props {
  data: ListingFormData;
  onChange: (data: Partial<ListingFormData>) => void;
  errors: Record<string, string>;
}

const ListingStep1 = ({ data, onChange, errors }: Props) => {
  const [selectedProperty, setSelectedProperty] = useState<string>(
    BBG_PROPERTIES.includes(data.address) ? data.address : ""
  );

  const handleSelectProperty = (addr: string) => {
    setSelectedProperty(addr);
    onChange({ address: addr });
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-foreground">About your place</h2>

      {/* Management question */}
      <div>
        <Label className="text-sm font-medium">Is your property managed by a property management company?</Label>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              onChange({ management_type: "bbg" });
              if (!BBG_PROPERTIES.includes(data.address)) {
                setSelectedProperty("");
                onChange({ management_type: "bbg", address: "" });
              }
            }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
              data.management_type === "bbg"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/40"
            )}
          >
            <Building2 className={cn("h-6 w-6", data.management_type === "bbg" ? "text-primary" : "text-muted-foreground")} />
            <span className="text-sm font-medium text-foreground">Yes, managed by Boston Brokerage Group</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedProperty("");
              onChange({ management_type: "self" });
            }}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
              data.management_type === "self"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border hover:border-primary/40"
            )}
          >
            <User className={cn("h-6 w-6", data.management_type === "self" ? "text-primary" : "text-muted-foreground")} />
            <span className="text-sm font-medium text-foreground">No, I manage it myself</span>
          </button>
        </div>
        {data.management_type === "bbg" && (
          <p className="mt-2 text-xs text-muted-foreground">
            Your listing will be reviewed by Boston Brokerage Group before going live, usually within 24 hours
          </p>
        )}
        {data.management_type === "self" && (
          <p className="mt-2 text-xs text-muted-foreground">
            Your listing will go live instantly when you publish — no approval needed!
          </p>
        )}
        {errors.management_type && <p className="mt-1 text-sm text-destructive">{errors.management_type}</p>}
      </div>

      {/* BBG Property Catalog */}
      {data.management_type === "bbg" && (
        <div>
          <Label className="text-sm font-medium">Select your property from the Boston Brokerage Group catalog</Label>
          <div className="mt-2 grid gap-2">
            {BBG_PROPERTIES.map((addr) => (
              <button
                key={addr}
                type="button"
                onClick={() => handleSelectProperty(addr)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                  selectedProperty === addr
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40"
                )}
              >
                <Building2 className={cn("h-4 w-4 shrink-0", selectedProperty === addr ? "text-primary" : "text-muted-foreground")} />
                <span className="flex-1 text-sm font-medium text-foreground">{addr}</span>
                {selectedProperty === addr && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
          {errors.address && <p className="mt-1 text-sm text-destructive">{errors.address}</p>}
        </div>
      )}

      {/* Manual address for self-managed */}
      {data.management_type !== "bbg" && (
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
      )}

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
