import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

export interface SubletApplicationData {
  full_name: string;
  ssn_encrypted: string;
  phone: string;
  email: string;
  current_address: string;
  current_city: string;
  current_state: string;
  current_zip: string;
  previous_address: string;
  previous_city: string;
  previous_state: string;
  previous_zip: string;
  current_landlord_name: string;
  current_landlord_phone: string;
  prior_landlord_name: string;
  dates_of_occupancy: string;
  occupation: string;
  employer: string;
  employer_contact: string;
  length_of_employment: string;
  salary: string;
  cosigner_name: string;
  cosigner_address: string;
  cosigner_phone: string;
  cosigner_email: string;
  rental_address: string;
  rental_unit: string;
  rental_city: string;
  term_months: number | null;
  move_in_date: string;
  move_out_date: string;
  total_tenants: number | null;
  number_of_pets: number | null;
  apartment_size: string;
  co_tenant_names: string;
  is_convicted_felon: boolean;
  felony_details: string;
  first_month_rent: number | null;
  processing_fee: number;
  last_month_rent: number | null;
  security_deposit: number | null;
  sublet_fee: number | null;
  balance_due: number | null;
  signature_text: string;
}

const EMPTY_DATA: SubletApplicationData = {
  full_name: "", ssn_encrypted: "", phone: "", email: "",
  current_address: "", current_city: "", current_state: "", current_zip: "",
  previous_address: "", previous_city: "", previous_state: "", previous_zip: "",
  current_landlord_name: "", current_landlord_phone: "", prior_landlord_name: "", dates_of_occupancy: "",
  occupation: "", employer: "", employer_contact: "", length_of_employment: "", salary: "",
  cosigner_name: "", cosigner_address: "", cosigner_phone: "", cosigner_email: "",
  rental_address: "", rental_unit: "", rental_city: "",
  term_months: null, move_in_date: "", move_out_date: "",
  total_tenants: null, number_of_pets: 0, apartment_size: "", co_tenant_names: "",
  is_convicted_felon: false, felony_details: "",
  first_month_rent: null, processing_fee: 65, last_month_rent: null,
  security_deposit: null, sublet_fee: null, balance_due: null,
  signature_text: "",
};

const SECTIONS = [
  "Personal Information",
  "Landlord Information",
  "Employment & Income",
  "Co-signer Information",
  "Sublet Details",
  "Background & Financial",
  "Review & Sign",
];

interface Props {
  initialData?: Partial<SubletApplicationData>;
  listingAddress?: string;
  listingUnit?: string;
  listingCity?: string;
  listingRent?: number | null;
  onSave: (data: SubletApplicationData) => void;
  onSubmit: (data: SubletApplicationData) => void;
  saving?: boolean;
}

export default function BBGSubletApplicationForm({
  initialData, listingAddress, listingUnit, listingCity, listingRent, onSave, onSubmit, saving,
}: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SubletApplicationData>({
    ...EMPTY_DATA,
    ...initialData,
    rental_address: initialData?.rental_address || listingAddress || "",
    rental_unit: initialData?.rental_unit || listingUnit || "",
    rental_city: initialData?.rental_city || listingCity || "",
    first_month_rent: initialData?.first_month_rent ?? listingRent ?? null,
    last_month_rent: initialData?.last_month_rent ?? listingRent ?? null,
    security_deposit: initialData?.security_deposit ?? listingRent ?? null,
  });

  const set = (field: keyof SubletApplicationData, value: any) =>
    setData((prev) => ({ ...prev, [field]: value }));

  // Auto-calc balance
  useEffect(() => {
    const fmr = data.first_month_rent || 0;
    const lmr = data.last_month_rent || 0;
    const sd = data.security_deposit || 0;
    const sf = data.sublet_fee || 0;
    set("balance_due", fmr + data.processing_fee + lmr + sd + sf);
  }, [data.first_month_rent, data.last_month_rent, data.security_deposit, data.sublet_fee, data.processing_fee]);

  const maskSSN = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return digits.slice(0, 3) + "-" + digits.slice(3);
    return digits.slice(0, 3) + "-" + digits.slice(3, 5) + "-" + digits.slice(5);
  };

  const renderSection = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Legal Name</Label>
              <Input id="full_name" value={data.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="John A. Smith" />
            </div>
            <div>
              <Label htmlFor="ssn">Social Security Number</Label>
              <Input id="ssn" value={maskSSN(data.ssn_encrypted)} onChange={(e) => set("ssn_encrypted", e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="•••-••-••••" type="text" autoComplete="off" />
              <p className="text-xs text-muted-foreground mt-1">Encrypted and only visible to BBG staff</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={data.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(617) 555-0100" />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={data.email} onChange={(e) => set("email", e.target.value)} placeholder="john@example.com" />
              </div>
            </div>
            <div>
              <Label>Current Address</Label>
              <Input value={data.current_address} onChange={(e) => set("current_address", e.target.value)} placeholder="123 Main St" className="mb-2" />
              <div className="grid grid-cols-3 gap-2">
                <Input value={data.current_city} onChange={(e) => set("current_city", e.target.value)} placeholder="City" />
                <Input value={data.current_state} onChange={(e) => set("current_state", e.target.value)} placeholder="State" />
                <Input value={data.current_zip} onChange={(e) => set("current_zip", e.target.value)} placeholder="Zip" />
              </div>
            </div>
            <div>
              <Label>Previous Address</Label>
              <Input value={data.previous_address} onChange={(e) => set("previous_address", e.target.value)} placeholder="456 Oak Ave" className="mb-2" />
              <div className="grid grid-cols-3 gap-2">
                <Input value={data.previous_city} onChange={(e) => set("previous_city", e.target.value)} placeholder="City" />
                <Input value={data.previous_state} onChange={(e) => set("previous_state", e.target.value)} placeholder="State" />
                <Input value={data.previous_zip} onChange={(e) => set("previous_zip", e.target.value)} placeholder="Zip" />
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Current Landlord Name</Label>
                <Input value={data.current_landlord_name} onChange={(e) => set("current_landlord_name", e.target.value)} placeholder="Jane Doe" />
              </div>
              <div>
                <Label>Landlord Phone</Label>
                <Input value={data.current_landlord_phone} onChange={(e) => set("current_landlord_phone", e.target.value)} placeholder="(617) 555-0200" />
              </div>
            </div>
            <div>
              <Label>Prior Landlord Name</Label>
              <Input value={data.prior_landlord_name} onChange={(e) => set("prior_landlord_name", e.target.value)} placeholder="Previous landlord's name" />
            </div>
            <div>
              <Label>Dates of Occupancy</Label>
              <Input value={data.dates_of_occupancy} onChange={(e) => set("dates_of_occupancy", e.target.value)} placeholder="Sep 2023 – Aug 2024" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label>Occupation / Source of Income</Label>
              <Input value={data.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="Student / Part-time barista" />
            </div>
            <div>
              <Label>Employer</Label>
              <Input value={data.employer} onChange={(e) => set("employer", e.target.value)} placeholder="Starbucks" />
            </div>
            <div>
              <Label>Employer Contact Information</Label>
              <Input value={data.employer_contact} onChange={(e) => set("employer_contact", e.target.value)} placeholder="Phone or email" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Length of Employment</Label>
                <Input value={data.length_of_employment} onChange={(e) => set("length_of_employment", e.target.value)} placeholder="2 years" />
              </div>
              <div>
                <Label>Salary</Label>
                <Input value={data.salary} onChange={(e) => set("salary", e.target.value)} placeholder="$35,000/yr" />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label>Co-signer Full Name</Label>
              <Input value={data.cosigner_name} onChange={(e) => set("cosigner_name", e.target.value)} placeholder="Parent or guardian name" />
            </div>
            <div>
              <Label>Co-signer Address</Label>
              <Input value={data.cosigner_address} onChange={(e) => set("cosigner_address", e.target.value)} placeholder="Full address" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Co-signer Phone</Label>
                <Input value={data.cosigner_phone} onChange={(e) => set("cosigner_phone", e.target.value)} placeholder="(555) 555-0300" />
              </div>
              <div>
                <Label>Co-signer Email</Label>
                <Input value={data.cosigner_email} onChange={(e) => set("cosigner_email", e.target.value)} placeholder="parent@email.com" />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Rental Address</Label>
                <Input value={data.rental_address} onChange={(e) => set("rental_address", e.target.value)} placeholder="Auto-filled from listing" />
              </div>
              <div>
                <Label>Unit #</Label>
                <Input value={data.rental_unit} onChange={(e) => set("rental_unit", e.target.value)} placeholder="4B" />
              </div>
            </div>
            <div>
              <Label>City</Label>
              <Input value={data.rental_city} onChange={(e) => set("rental_city", e.target.value)} placeholder="Boston" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Term (Months)</Label>
                <Input type="number" value={data.term_months ?? ""} onChange={(e) => set("term_months", e.target.value ? Number(e.target.value) : null)} placeholder="3" />
              </div>
              <div>
                <Label>Move-in Date</Label>
                <Input type="date" value={data.move_in_date} onChange={(e) => set("move_in_date", e.target.value)} />
              </div>
              <div>
                <Label>Move-out Date</Label>
                <Input type="date" value={data.move_out_date} onChange={(e) => set("move_out_date", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Total # of Tenants</Label>
                <Input type="number" value={data.total_tenants ?? ""} onChange={(e) => set("total_tenants", e.target.value ? Number(e.target.value) : null)} placeholder="1" />
              </div>
              <div>
                <Label># of Pets</Label>
                <Input type="number" value={data.number_of_pets ?? ""} onChange={(e) => set("number_of_pets", e.target.value ? Number(e.target.value) : null)} placeholder="0" />
              </div>
              <div>
                <Label>Apartment Size</Label>
                <Select value={data.apartment_size} onValueChange={(v) => set("apartment_size", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["Studio", "1 Bed", "2 Bed", "3 Bed", "4 Bed", "5 Bed"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Names of All Co-Tenants</Label>
              <Textarea value={data.co_tenant_names} onChange={(e) => set("co_tenant_names", e.target.value)} placeholder="List all co-tenants" rows={2} />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Criminal History</h4>
              <div className="flex items-center gap-3">
                <Switch checked={data.is_convicted_felon} onCheckedChange={(v) => set("is_convicted_felon", v)} />
                <Label>Are you a convicted felon?</Label>
              </div>
              {data.is_convicted_felon && (
                <Textarea value={data.felony_details} onChange={(e) => set("felony_details", e.target.value)} placeholder="Please submit details of convictions" rows={3} />
              )}
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Financial Summary</h4>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                {([
                  ["First Month's Rent", "first_month_rent"],
                  ["Processing Fee to BMG", "processing_fee"],
                  ["Last Month's Rent", "last_month_rent"],
                  ["Security Deposit", "security_deposit"],
                  ["Sublet Fee / Roommate Change Fee", "sublet_fee"],
                ] as const).map(([label, key]) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <Label className="text-sm whitespace-nowrap">{label}</Label>
                    {key === "processing_fee" ? (
                      <span className="text-sm font-medium">$65.00</span>
                    ) : (
                      <Input type="number" className="w-32 text-right" value={(data[key] as number) ?? ""} onChange={(e) => set(key, e.target.value ? Number(e.target.value) : null)} placeholder="$0" />
                    )}
                  </div>
                ))}
                <div className="border-t pt-2 flex items-center justify-between font-semibold">
                  <span>Balance Due</span>
                  <span className="text-primary">${(data.balance_due || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <div className="rounded-lg border bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed">
              <p>Base rent and other monthly charges are due and payable on the first date of each month. Pursuant to Massachusetts law, the management shall not make any inquiry concerning race, religious creed, color, national origin, sex, sexual orientation, age (except for a minor), ancestry, or marital status of the applicant.</p>
              <p className="mt-2">The undersigned warrants and represents that all statements herein are true and agrees to execute upon the presentation of a Rental Housing Association or Tenancy at Will agreement.</p>
            </div>
            <div>
              <Label htmlFor="sig">Type Your Full Legal Name to Sign</Label>
              <Input id="sig" className="mt-1 text-lg" style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }} value={data.signature_text} onChange={(e) => set("signature_text", e.target.value)} placeholder="Type your full name" />
              {data.signature_text && (
                <div className="mt-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center">
                  <p className="text-2xl" style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }}>{data.signature_text}</p>
                  <p className="text-xs text-muted-foreground mt-1">Applicant Signature</p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Section progress */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {SECTIONS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)} className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="min-h-[320px]">{renderSection()}</div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep(step - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSave(data)} disabled={saving}>
          <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save Progress"}
        </Button>
        {step < SECTIONS.length - 1 ? (
          <Button size="sm" onClick={() => setStep(step + 1)}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button size="sm" onClick={() => onSubmit(data)} disabled={!data.signature_text || saving}>
            Submit Application
          </Button>
        )}
      </div>
    </div>
  );
}
