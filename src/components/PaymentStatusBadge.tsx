import { Badge } from "@/components/ui/badge";

type PaymentStatus = "paid" | "pending" | "failed" | "refund_requested" | "deposit_held" | "deposit_released" | "processing" | "transferred";

const statusConfig: Record<PaymentStatus, { label: string; variant: "emerald" | "pending" | "rejected" | "amber" | "cyan" | "default" }> = {
  paid: { label: "Paid", variant: "emerald" },
  pending: { label: "Pending", variant: "pending" },
  failed: { label: "Failed", variant: "rejected" },
  refund_requested: { label: "Refund Requested", variant: "amber" },
  deposit_held: { label: "Deposit Held", variant: "cyan" },
  deposit_released: { label: "Deposit Released", variant: "emerald" },
  processing: { label: "Processing", variant: "pending" },
  transferred: { label: "Transferred", variant: "emerald" },
};

const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export type { PaymentStatus };
export default PaymentStatusBadge;
