import { format } from "date-fns";

interface ApplicationData {
  full_name?: string | null;
  ssn_encrypted?: string | null;
  phone?: string | null;
  email?: string | null;
  current_address?: string | null;
  current_city?: string | null;
  current_state?: string | null;
  current_zip?: string | null;
  previous_address?: string | null;
  previous_city?: string | null;
  previous_state?: string | null;
  previous_zip?: string | null;
  current_landlord_name?: string | null;
  current_landlord_phone?: string | null;
  prior_landlord_name?: string | null;
  dates_of_occupancy?: string | null;
  occupation?: string | null;
  employer?: string | null;
  employer_contact?: string | null;
  length_of_employment?: string | null;
  salary?: string | null;
  cosigner_name?: string | null;
  cosigner_address?: string | null;
  cosigner_phone?: string | null;
  cosigner_email?: string | null;
  rental_address?: string | null;
  rental_unit?: string | null;
  rental_city?: string | null;
  term_months?: number | null;
  move_in_date?: string | null;
  move_out_date?: string | null;
  total_tenants?: number | null;
  number_of_pets?: number | null;
  apartment_size?: string | null;
  co_tenant_names?: string | null;
  is_convicted_felon?: boolean | null;
  felony_details?: string | null;
  first_month_rent?: number | null;
  processing_fee?: number | null;
  last_month_rent?: number | null;
  security_deposit?: number | null;
  sublet_fee?: number | null;
  balance_due?: number | null;
  signature_text?: string | null;
  signed_at?: string | null;
  completed_at?: string | null;
}

interface Props {
  data: ApplicationData;
  tenantName?: string;
  verificationId?: string;
}

const SIZES = ["Studio", "1 Bed", "2 Bed", "3 Bed", "4 Bed", "5 Bed"];

function Field({ label, value, className = "" }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={`border-b border-black/40 pb-0.5 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-wide text-black/70">{label}: </span>
      <span className="text-[11px] text-black">{value || ""}</span>
    </div>
  );
}

function money(val?: number | null) {
  if (val == null) return "";
  return `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BMGSubletApplicationView({ data, tenantName, verificationId }: Props) {
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
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-700 rounded-sm flex items-center justify-center">
            <span className="text-white font-bold text-lg" style={{ fontFamily: "serif" }}>b</span>
          </div>
          <div>
            <p className="text-[15px] font-bold tracking-wide" style={{ fontFamily: "sans-serif" }}>Boston Management Group</p>
            <p className="text-[9px] text-black/60" style={{ fontFamily: "sans-serif" }}>Property Management & Real Estate</p>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center my-4">
        <h1 className="text-[16px] font-bold" style={{ fontFamily: "sans-serif" }}>
          Sublet application for <span className="border-b border-black px-2">{tenantName || "________"}</span>'s Room
        </h1>
      </div>

      {/* Form fields */}
      <div className="space-y-2.5 text-[11px]">
        {/* Row 1: Name & SSN */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name" value={data.full_name} />
          <Field label="Social Security #" value={maskSSN(data.ssn_encrypted)} />
        </div>

        {/* Row 2: Phone & Email */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone" value={data.phone} />
          <Field label="Email" value={data.email} />
        </div>

        {/* Row 3: Current Address */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Current Address, City, State, Zip" value={[data.current_address, data.current_city, data.current_state, data.current_zip].filter(Boolean).join(", ")} />
          <Field label="Landlord Phone" value={data.current_landlord_phone} />
        </div>

        {/* Row 4: Current Landlord */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Current Landlord" value={data.current_landlord_name} />
          <Field label="Landlord Phone" value={data.current_landlord_phone} />
        </div>

        {/* Row 5: Dates & Prior Landlord */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Dates of Occupancy" value={data.dates_of_occupancy} />
          <Field label="Prior Landlord" value={data.prior_landlord_name} />
        </div>

        {/* Row 6: Previous Address */}
        <Field label="Previous Address, City, State, Zip" value={[data.previous_address, data.previous_city, data.previous_state, data.previous_zip].filter(Boolean).join(", ")} />

        {/* Row 7: Occupation & Employer */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Occupation and Source of Income" value={data.occupation} />
          <Field label="Employer" value={data.employer} />
        </div>

        {/* Row 8: Employment Length & Salary */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Length of Employment" value={data.length_of_employment} />
          <Field label="Salary" value={data.salary} />
        </div>

        {/* Row 9: Employer Contact */}
        <Field label="Employer contact information" value={data.employer_contact} />

        {/* Row 10: Cosigner */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Co-Signer Name and Address" value={[data.cosigner_name, data.cosigner_address].filter(Boolean).join(" — ")} />
          <Field label="Co-Signer phone and email" value={[data.cosigner_phone, data.cosigner_email].filter(Boolean).join(" / ")} />
        </div>

        {/* Row 11: Rental Address */}
        <Field label="Rental Address, Unit #, City" value={[data.rental_address, data.rental_unit ? `Unit ${data.rental_unit}` : null, data.rental_city].filter(Boolean).join(", ")} />

        {/* Row 12: Terms */}
        <div className="grid grid-cols-3 gap-4">
          <Field label="Terms in months" value={data.term_months != null ? String(data.term_months) : ""} />
          <Field label="From" value={data.move_in_date ? format(new Date(data.move_in_date + "T00:00:00"), "MM/dd/yyyy") : ""} />
          <Field label="To" value={data.move_out_date ? format(new Date(data.move_out_date + "T00:00:00"), "MM/dd/yyyy") : ""} />
        </div>

        {/* Row 13: Tenants, Pets, Apartment Size */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Total # of Tenants / Pets" value={`${data.total_tenants ?? ""} tenants, ${data.number_of_pets ?? 0} pets`} />
          <div className="border-b border-black/40 pb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-black/70">Apt Size: </span>
            <span className="text-[10px] inline-flex gap-2 ml-1">
              {SIZES.map((s) => (
                <span key={s} className="inline-flex items-center gap-0.5">
                  <span className={`inline-block w-3 h-3 border border-black/60 rounded-sm text-center text-[8px] leading-3 ${data.apartment_size === s ? "bg-black text-white font-bold" : ""}`}>
                    {data.apartment_size === s ? "✓" : ""}
                  </span>
                  <span>{s}</span>
                </span>
              ))}
            </span>
          </div>
        </div>

        {/* Row 14: Co-tenants */}
        <Field label="Names of all Co-Tenants" value={data.co_tenant_names} />
      </div>

      {/* Legal Text & Financial Table side by side */}
      <div className="mt-4 flex gap-4">
        {/* Legal text */}
        <div className="flex-1 text-[8.5px] leading-[12px] text-black/80" style={{ fontFamily: "serif" }}>
          <p>
            {data.is_convicted_felon ? `Applicant has disclosed a felony conviction. Details: ${data.felony_details || "N/A"}. ` : ""}
            Base rent and other monthly charges are due and payable on the first date of each month.
            Pursuant to Massachusetts law, the management shall not make any inquiry concerning race, religious creed, color,
            national origin, sex, sexual orientation, age (except for a minor), ancestry, or marital status of the applicant.
          </p>
          <p className="mt-1.5">
            The applicant consents to and authorizes a consumer credit report and/or investigative report to be prepared.
            It is agreed that the owner and/or agent may terminate any agreement entered into on behalf of the owner for
            any misrepresentation made above. The applicant understands that this is not a rental agreement and that no
            tenancy has been created.
          </p>
          <p className="mt-1.5">
            The undersigned warrants and represents that all statements herein are true and agrees to execute upon
            the presentation of a Rental Housing Association or Tenancy at Will agreement. The applicant shall not be
            entitled to possession until the execution of such agreement and the payment of all charges indicated.
          </p>
        </div>

        {/* Financial table */}
        <div className="w-56 shrink-0">
          <table className="w-full text-[10px] border-collapse" style={{ fontFamily: "sans-serif" }}>
            <tbody>
              {[
                ["First Month's Rent", money(data.first_month_rent)],
                ["Processing Fee to BMG", "$65.00"],
                ["Last Month's Rent", money(data.last_month_rent)],
                ["Security Deposit", money(data.security_deposit)],
                ["Sublet fee/roommate change fee", money(data.sublet_fee)],
              ].map(([label, val]) => (
                <tr key={label} className="border-b border-black/30">
                  <td className="py-1 pr-2 text-black/80">{label}</td>
                  <td className="py-1 text-right font-medium">{val}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-black">
                <td className="py-1.5 pr-2 font-bold">Balance Due</td>
                <td className="py-1.5 text-right font-bold">{money(data.balance_due)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Signature section */}
      <div className="mt-6 grid grid-cols-2 gap-8">
        <div>
          <div className="border-b border-black pt-4 pb-1 min-h-[40px]">
            {data.signature_text && (
              <p className="text-[16px] italic" style={{ fontFamily: "'Georgia', serif" }}>{data.signature_text}</p>
            )}
          </div>
          <p className="text-[9px] mt-0.5 text-black/60">Applicant Signature</p>
          {data.signed_at && (
            <p className="text-[8px] text-black/50 mt-0.5">Signed digitally: {format(new Date(data.signed_at), "MMMM d, yyyy 'at' h:mm a")}</p>
          )}
        </div>
        <div>
          <div className="border-b border-black pt-4 pb-1 min-h-[40px]">
            <p className="text-[11px]" style={{ fontFamily: "sans-serif" }}>Boston Management Group</p>
          </div>
          <p className="text-[9px] mt-0.5 text-black/60">Management</p>
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
