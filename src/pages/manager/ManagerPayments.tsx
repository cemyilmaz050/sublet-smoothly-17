import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Placeholder data — will connect to real payment data when Stripe integration is live
const mockTransactions = [
  { id: "1", renter: "Alex Rivera", listing: "123 Main St, Apt 4B", amount: 2400, date: "2026-03-01", status: "completed" },
  { id: "2", renter: "Jordan Lee", listing: "456 Oak Ave, Unit 2A", amount: 1800, date: "2026-03-01", status: "completed" },
  { id: "3", renter: "Sam Wilson", listing: "789 Pine Rd", amount: 2100, date: "2026-02-01", status: "completed" },
  { id: "4", renter: "Alex Rivera", listing: "123 Main St, Apt 4B", amount: 2400, date: "2026-02-01", status: "completed" },
];

const ManagerPayments = () => {
  const totalEarnings = mockTransactions.reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments & Earnings</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of all deposits and sublet fees</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, icon: DollarSign, color: "text-emerald" },
          { label: "This Month", value: `$${(2400 + 1800).toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
          { label: "Transactions", value: mockTransactions.length, icon: CreditCard, color: "text-cyan" },
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

      {/* Transaction table */}
      <Card className="shadow-card">
        <div className="px-6 pt-5 pb-3">
          <h2 className="text-base font-semibold text-foreground">Transaction History</h2>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Renter</TableHead>
                <TableHead>Listing</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransactions.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium text-foreground">{t.renter}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{t.listing}</TableCell>
                  <TableCell className="font-semibold text-foreground">${t.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="emerald" className="text-xs gap-1">
                      <ArrowUpRight className="h-3 w-3" />Completed
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagerPayments;
