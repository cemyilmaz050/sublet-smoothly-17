import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import EmptyState from "@/components/EmptyState";

const ManagerPayments = () => {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments & Earnings</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of all deposits and sublet fees</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Earnings", value: "$0", icon: DollarSign, color: "text-emerald" },
          { label: "This Month", value: "$0", icon: TrendingUp, color: "text-primary" },
          { label: "Transactions", value: "0", icon: CreditCard, color: "text-cyan" },
        ].map(card => (
          <Card key={card.label} className="shadow-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent">
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-bold text-foreground">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      <EmptyState
        icon={DollarSign}
        title="No transactions yet"
        description="Payment activity from sublet deposits and fees will appear here once tenants start processing payments."
      />
    </div>
  );
};

export default ManagerPayments;
