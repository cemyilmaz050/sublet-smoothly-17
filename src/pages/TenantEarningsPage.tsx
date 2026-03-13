import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, Clock, Pencil, Calendar } from "lucide-react";

import PaymentStatusBadge from "@/components/PaymentStatusBadge";
import type { PaymentStatus } from "@/components/PaymentStatusBadge";
import PlatformFeeTooltip from "@/components/PlatformFeeTooltip";
import { Link } from "react-router-dom";

const payouts: { date: string; amount: string; status: PaymentStatus }[] = [
  { date: "Mar 1, 2026", amount: "$2,350.00", status: "transferred" },
  { date: "Feb 1, 2026", amount: "$2,350.00", status: "transferred" },
  { date: "Jan 15, 2026", amount: "$2,350.00", status: "transferred" },
];

const TenantEarningsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-8">
        <h1 className="mb-1 text-3xl font-bold text-foreground">Earnings</h1>
        <p className="mb-8 text-muted-foreground">Track your payouts and earnings</p>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card className="shadow-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald/15">
                <TrendingUp className="h-6 w-6 text-emerald" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-xl font-bold text-foreground">$7,050.00</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber/15">
                <Clock className="h-6 w-6 text-amber" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payout</p>
                <p className="text-xl font-bold text-foreground">$2,350.00</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Payout</p>
                <p className="text-xl font-bold text-foreground">Apr 1</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payout Schedule */}
        <div className="mb-6 flex items-center justify-between rounded-lg border bg-card p-4">
          <div>
            <p className="font-medium text-foreground">Payout Schedule</p>
            <p className="text-sm text-muted-foreground">Payouts are processed on the 1st of every month</p>
          </div>
          <PlatformFeeTooltip amount={2500} />
        </div>

        {/* Payout History */}
        <Card className="mb-6 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Payout History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{p.date}</TableCell>
                    <TableCell className="text-right font-medium text-foreground">{p.amount}</TableCell>
                    <TableCell className="text-right">
                      <PaymentStatusBadge status={p.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Payout */}
        <Link to="/pricing-setup">
          <Button variant="outline" size="lg" className="w-full">
            <Pencil className="mr-1 h-4 w-4" />
            Edit Payout Method
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default TenantEarningsPage;
