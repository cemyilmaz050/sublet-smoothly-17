import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";

export interface GuarantyData {
  lessee_name: string;
  premises_address: string;
  premises_unit: string;
  premises_city: string;
  guarantor_name: string;
  guarantor_dob: string;
  guarantor_address: string;
  guarantor_phone: string;
  guarantor_email: string;
  guarantor_ssn_encrypted: string;
  guarantor_annual_income: string;
  agent_name: string;
  notary_state: string;
  notary_county: string;
  notary_date: string;
  notary_person_name: string;
  guarantor_signature_text: string;
}

const EMPTY: GuarantyData = {
  lessee_name: "", premises_address: "", premises_unit: "", premises_city: "",
  guarantor_name: "", guarantor_dob: "", guarantor_address: "", guarantor_phone: "",
  guarantor_email: "", guarantor_ssn_encrypted: "", guarantor_annual_income: "",
  agent_name: "Alp Kantar",
  notary_state: "Massachusetts", notary_county: "", notary_date: "", notary_person_name: "",
  guarantor_signature_text: "",
};

const SECTIONS = ["Property & Lessee", "Guarantor Information", "Notary Information", "Review & Sign"];

interface Props {
  initialData?: Partial<GuarantyData>;
  listingAddress?: string;
  listingUnit?: string;
  listingCity?: string;
  lesseeName?: string;
  onSave: (data: GuarantyData) => void;
  onSubmit: (data: GuarantyData) => void;
  saving?: boolean;
}

export default function BBGGuarantyOfLeaseForm({
  initialData, listingAddress, listingUnit, listingCity, lesseeName, onSave, onSubmit, saving,
}: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<GuarantyData>({
    ...EMPTY,
    ...initialData,
    premises_address: initialData?.premises_address || listingAddress || "",
    premises_unit: initialData?.premises_unit || listingUnit || "",
    premises_city: initialData?.premises_city || listingCity || "",
    lessee_name: initialData?.lessee_name || lesseeName || "",
  });

  const set = (field: keyof GuarantyData, value: string) =>
    setData((prev) => ({ ...prev, [field]: value }));

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
            <div className="rounded-lg border bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed">
              <p>In consideration of the execution of a certain lease for the premises located at the address below, the undersigned jointly and severally guarantees the lessor and its successors the performance of all the covenants set forth in the lease, including but not limited to the punctual payments of all rents and other payments payable under the lease.</p>
            </div>
            <div>
              <Label>Occupant / Lessee Name (Tenant's Name)</Label>
              <Input value={data.lessee_name} onChange={(e) => set("lessee_name", e.target.value)} placeholder="Name of the tenant being guaranteed" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Premises Address</Label>
                <Input value={data.premises_address} onChange={(e) => set("premises_address", e.target.value)} placeholder="Auto-filled from listing" />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={data.premises_unit} onChange={(e) => set("premises_unit", e.target.value)} placeholder="4B" />
              </div>
            </div>
            <div>
              <Label>City (Massachusetts)</Label>
              <Input value={data.premises_city} onChange={(e) => set("premises_city", e.target.value)} placeholder="Boston" />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Please print clearly & complete all fields below for the Cosigner</p>
            <div>
              <Label>Full Name</Label>
              <Input value={data.guarantor_name} onChange={(e) => set("guarantor_name", e.target.value)} placeholder="Guarantor's full legal name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date of Birth</Label>
                <Input type="date" value={data.guarantor_dob} onChange={(e) => set("guarantor_dob", e.target.value)} />
              </div>
              <div>
                <Label>Social Security Number</Label>
                <Input value={maskSSN(data.guarantor_ssn_encrypted)} onChange={(e) => set("guarantor_ssn_encrypted", e.target.value.replace(/\D/g, "").slice(0, 9))} placeholder="•••-••-••••" autoComplete="off" />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value={data.guarantor_address} onChange={(e) => set("guarantor_address", e.target.value)} placeholder="Full mailing address" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone Number</Label>
                <Input value={data.guarantor_phone} onChange={(e) => set("guarantor_phone", e.target.value)} placeholder="(555) 555-0100" />
              </div>
              <div>
                <Label>Email Address</Label>
                <Input type="email" value={data.guarantor_email} onChange={(e) => set("guarantor_email", e.target.value)} placeholder="guarantor@email.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Annual Income</Label>
                <Input value={data.guarantor_annual_income} onChange={(e) => set("guarantor_annual_income", e.target.value)} placeholder="$75,000" />
              </div>
              <div>
                <Label>Agent</Label>
                <Input value={data.agent_name} readOnly className="bg-muted" />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>State</Label>
                <Input value={data.notary_state} onChange={(e) => set("notary_state", e.target.value)} placeholder="Massachusetts" />
              </div>
              <div>
                <Label>County</Label>
                <Input value={data.notary_county} onChange={(e) => set("notary_county", e.target.value)} placeholder="Suffolk" />
              </div>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={data.notary_date} onChange={(e) => set("notary_date", e.target.value)} />
            </div>
            <div>
              <Label>Name of Person Appearing</Label>
              <Input value={data.notary_person_name} onChange={(e) => set("notary_person_name", e.target.value)} placeholder="Person appearing before notary" />
              <p className="text-xs text-muted-foreground mt-1">Then personally appeared before me the above named person, and being first duly sworn acknowledged the foregoing to be their free act and deed.</p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="rounded-lg border bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed">
              <p>The lessor reserves the right to obtain or cause to be prepared a consumer credit report relating to the guarantor.</p>
              <p className="mt-2">For additional information regarding the apartment rental procedure and terms, please visit <span className="text-primary">www.realestateboston.com</span></p>
            </div>
            <div>
              <Label htmlFor="gsig">Type Your Full Legal Name to Sign</Label>
              <Input id="gsig" className="mt-1 text-lg" style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }} value={data.guarantor_signature_text} onChange={(e) => set("guarantor_signature_text", e.target.value)} placeholder="Guarantor's full name" />
              {data.guarantor_signature_text && (
                <div className="mt-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center">
                  <p className="text-2xl" style={{ fontFamily: "'Georgia', serif", fontStyle: "italic" }}>{data.guarantor_signature_text}</p>
                  <p className="text-xs text-muted-foreground mt-1">Guarantor Signature</p>
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
          <Button size="sm" onClick={() => onSubmit(data)} disabled={!data.guarantor_signature_text || saving}>
            Submit Guaranty
          </Button>
        )}
      </div>
    </div>
  );
}
