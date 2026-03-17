import { format } from "date-fns";

interface GuarantyData {
  lessee_name?: string | null;
  premises_address?: string | null;
  premises_unit?: string | null;
  premises_city?: string | null;
  guarantor_name?: string | null;
  guarantor_dob?: string | null;
  guarantor_address?: string | null;
  guarantor_phone?: string | null;
  guarantor_email?: string | null;
  guarantor_ssn_encrypted?: string | null;
  guarantor_annual_income?: string | null;
  agent_name?: string | null;
  notary_state?: string | null;
  notary_county?: string | null;
  notary_date?: string | null;
  notary_person_name?: string | null;
  guarantor_signature_text?: string | null;
  signed_at?: string | null;
  completed_at?: string | null;
}

interface Props {
  data: GuarantyData;
  verificationId?: string;
}

function UnderlineField({ label, value, className = "" }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={`mb-2 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-wide text-black/70">{label}: </span>
      <span className="border-b border-black/50 inline-block min-w-[120px] pb-0.5 text-[11px]">{value || ""}</span>
    </div>
  );
}

export default function BBGGuarantyOfLeaseView({ data, verificationId }: Props) {
  const maskSSN = (val?: string | null) => {
    if (!val) return "";
    const d = val.replace(/\D/g, "");
    if (d.length <= 3) return d;
    if (d.length <= 5) return d.slice(0, 3) + "-" + d.slice(3);
    return d.slice(0, 3) + "-" + d.slice(3, 5) + "-" + d.slice(5);
  };

  return (
    <div className="bg-white text-black font-sans print:text-black" style={{ fontFamily: "'Times New Roman', 'Georgia', serif", maxWidth: "8.5in", margin: "0 auto", padding: "0.5in 0.6in" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-700 rounded-sm flex items-center justify-center">
            <span className="text-white font-bold text-lg" style={{ fontFamily: "serif" }}>bb</span>
          </div>
          <div>
            <p className="text-[15px] font-bold tracking-wide" style={{ fontFamily: "sans-serif" }}>Boston Brokerage Group</p>
            <p className="text-[9px] text-black/60" style={{ fontFamily: "sans-serif" }}>Real Estate & Property Services</p>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-[18px] font-bold" style={{ fontFamily: "sans-serif" }}>GUARANTY OF LEASE</h1>
        </div>
      </div>

      {/* Legal body text */}
      <div className="text-[10px] leading-[15px] text-black/90 space-y-3 mb-6" style={{ fontFamily: "serif" }}>
        <p>
          In consideration of the execution of a certain lease for the premises located at{" "}
          <span className="border-b border-black/50 px-1 font-medium">
            {[data.premises_address, data.premises_unit ? `Unit ${data.premises_unit}` : null, data.premises_city].filter(Boolean).join(", ")}
          </span>
          {" "}in the state of{" "}
          <span className="border-b border-black/50 px-1 font-medium">Massachusetts</span>
          , the undersigned jointly and severally guarantees to the lessor and its successors the performance
          of all the covenants set forth in the lease, including but not limited to the punctual payments of all
          rents and other payments payable under the lease.
        </p>
        <p>
          This guarantee shall remain in effect for the full term of the lease and any extensions or renewals thereof.
          The guarantor waives notice of default by the tenant under the lease. In the event the tenant defaults
          on any provision of the lease, the guarantor shall be directly and primarily liable to the lessor.
        </p>
        <p>
          The lessor may proceed against the guarantor without first proceeding against the tenant and without
          previous notice to, or demand upon, either the tenant or the guarantor. The liability of the guarantor
          shall not be affected by any extension, modification, or other alteration of the lease.
        </p>
      </div>

      {/* Divider */}
      <hr className="border-t-2 border-black my-4" />

      {/* Occupant Information */}
      <div className="mb-4">
        <p className="text-[12px] font-bold uppercase tracking-wider text-center mb-2" style={{ fontFamily: "sans-serif" }}>
          OCCUPANT/LESSEE(S) INFORMATION
        </p>
        <div className="border-b border-black/50 pb-1 mb-4">
          <span className="text-[10px] text-black/70">Tenant Name: </span>
          <span className="text-[12px] font-medium">{data.lessee_name || ""}</span>
        </div>
      </div>

      {/* Guarantor Section Header */}
      <div className="text-center mb-1">
        <p className="text-[13px] font-bold uppercase tracking-wider" style={{ fontFamily: "sans-serif" }}>
          GUARANTOR'S INFORMATION
        </p>
        <p className="text-[9px] italic text-black/60 mb-3">
          Please print clearly and complete all fields below for the Cosigner
        </p>
      </div>

      {/* Guarantor fields - two columns */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4">
        <div>
          <UnderlineField label="Name" value={data.guarantor_name} />
          <UnderlineField label="Address" value={data.guarantor_address} />
          <div className="border-b border-black/30 mb-2 pb-1" />
          <UnderlineField label="Agent" value={data.agent_name || "Alp Kantar"} />
        </div>
        <div>
          <UnderlineField label="DOB" value={data.guarantor_dob ? format(new Date(data.guarantor_dob + "T00:00:00"), "MM/dd/yyyy") : ""} />
          <UnderlineField label="Phone #" value={data.guarantor_phone} />
          <UnderlineField label="Email address" value={data.guarantor_email} />
          <UnderlineField label="SSN" value={maskSSN(data.guarantor_ssn_encrypted)} />
          <UnderlineField label="Annual Income" value={data.guarantor_annual_income} />
        </div>
      </div>

      {/* Signature */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-wide text-black/70 mb-1">SIGNATURE:</p>
        <div className="border-b border-black pt-2 pb-1 min-h-[36px]">
          {data.guarantor_signature_text && (
            <p className="text-[18px] italic" style={{ fontFamily: "'Georgia', serif" }}>{data.guarantor_signature_text}</p>
          )}
        </div>
        {data.signed_at && (
          <p className="text-[8px] text-black/50 mt-0.5">Signed digitally: {format(new Date(data.signed_at), "MMMM d, yyyy 'at' h:mm a")}</p>
        )}
      </div>

      {/* Notary Section */}
      <div className="border-t-2 border-black pt-4 mb-6">
        <p className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ fontFamily: "sans-serif" }}>
          NOTARY INFORMATION
        </p>
        <div className="text-[10px] leading-[16px] space-y-2" style={{ fontFamily: "serif" }}>
          <div className="flex gap-8">
            <div>
              <span className="text-black/70">STATE OF </span>
              <span className="border-b border-black/50 inline-block min-w-[120px] pb-0.5">{data.notary_state || ""}</span>
            </div>
            <div>
              <span className="text-black/70">COUNTY OF </span>
              <span className="border-b border-black/50 inline-block min-w-[120px] pb-0.5">{data.notary_county || ""}</span>
            </div>
          </div>
          <div>
            <span className="text-black/70">DATE </span>
            <span className="border-b border-black/50 inline-block min-w-[150px] pb-0.5">
              {data.notary_date ? format(new Date(data.notary_date + "T00:00:00"), "MMMM d, yyyy") : ""}
            </span>
          </div>
          <p className="mt-2">
            Then personally appeared before me{" "}
            <span className="border-b border-black/50 px-1 font-medium">{data.notary_person_name || ""}</span>
            , and being first duly sworn acknowledged the foregoing to be their free act and deed.
          </p>
        </div>

        {/* Notary signature lines */}
        <div className="grid grid-cols-2 gap-8 mt-6">
          <div>
            <div className="border-b border-black pt-6 min-h-[30px]" />
            <p className="text-[9px] mt-0.5 text-black/60">Notary Public Signature</p>
          </div>
          <div>
            <div className="border-b border-black pt-6 min-h-[30px]" />
            <p className="text-[9px] mt-0.5 text-black/60">My Commission Expires</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-[9px] text-black/50" style={{ fontFamily: "sans-serif" }}>www.RealEstateBoston.com</p>
        {verificationId && (
          <p className="text-[7px] text-black/40 mt-1">SubIn Verification ID: {verificationId} · {data.completed_at ? format(new Date(data.completed_at), "MMMM d, yyyy") : ""}</p>
        )}
      </div>
    </div>
  );
}
