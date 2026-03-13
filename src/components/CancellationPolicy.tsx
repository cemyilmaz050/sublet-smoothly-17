import { ShieldCheck } from "lucide-react";

const CancellationPolicy = ({ compact = false }: { compact?: boolean }) => {
  if (compact) {
    return (
      <div className="rounded-lg border bg-accent/30 p-3 text-xs text-muted-foreground leading-relaxed">
        <ShieldCheck className="inline h-3.5 w-3.5 text-primary mr-1 -mt-0.5" />
        <strong className="text-foreground">Cancellation Policy:</strong> Full refund within 48 hours of booking if the sublet hasn't started. After 48 hours, the deposit is non-refundable. If the tenant cancels, you get a full refund automatically.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
        <h3 className="font-semibold text-foreground text-sm">Cancellation & Refund Policy</h3>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground">
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald shrink-0" />
          <span>Cancel within <strong className="text-foreground">48 hours</strong> of booking for a full deposit refund (if the sublet hasn't started).</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber shrink-0" />
          <span>After 48 hours, the security deposit is <strong className="text-foreground">non-refundable</strong>.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald shrink-0" />
          <span>If the tenant cancels after a deposit is paid, you receive a <strong className="text-foreground">full automatic refund</strong>.</span>
        </li>
      </ul>
    </div>
  );
};

export default CancellationPolicy;
