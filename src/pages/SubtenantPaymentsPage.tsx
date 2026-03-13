import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Calendar, DollarSign, RefreshCw } from "lucide-react";

import PaymentStatusBadge from "@/components/PaymentStatusBadge";
import type { PaymentStatus } from "@/components/PaymentStatusBadge";
import { Link } from "react-router-dom";

const payments: { date: string; description: string; amount: string; status: PaymentStatus }[] = [
  { date: "Mar 1, 2026", description: "Monthly Rent — March", amount: "$2,650.00", status: "paid" },
  { date: "Feb 1, 2026", description: "Monthly Rent — February", amount: "$2,650.00", status: "paid" },
  { date: "Jan 15, 2026", description: "Security Deposit", amount: "$2,500.00", status: "deposit_held" },
  { date: "Jan 15, 2026", description: "First Month + Service Fee", amount: "$2,650.00", status: "paid" },
];

const SubtenantPaymentsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-8">
        <h1 className="mb-1 text-3xl font-bold text-foreground">Payments</h1>
        <p className="mb-8 text-muted-foreground">Track your upcoming and past payments</p>

        {/* Upcoming Payment */}
        <Card className="mb-6 border-primary/20 shadow-card">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Payment Due</p>
                <p className="text-xl font-bold text-foreground">$2,650.00</p>
                <p className="text-xs text-muted-foreground">Due April 1, 2026</p>
              </div>
            </div>
            <Link to="/payments/summary">
              <Button>
                <DollarSign className="mr-1 h-4 w-4" />
                Pay Now
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card className="mb-6 shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-muted-foreground">{p.date}</TableCell>
                    <TableCell className="font-medium text-foreground">{p.description}</TableCell>
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

        {/* Update Payment Method */}
        <Card className="shadow-card">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Visa ending in 4242</p>
                <p className="text-xs text-muted-foreground">Expires 12/2028</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              Update
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubtenantPaymentsPage;
