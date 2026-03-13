import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, DollarSign } from "lucide-react";
import Navbar from "@/components/Navbar";
import EmptyState from "@/components/EmptyState";
import { Link } from "react-router-dom";

const SubtenantPaymentsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-3xl py-8">
        <h1 className="mb-1 text-3xl font-bold text-foreground">Payments</h1>
        <p className="mb-8 text-muted-foreground">Track your upcoming and past payments</p>

        {/* No upcoming payment */}
        <Card className="mb-6 border-border shadow-card">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Payment Due</p>
                <p className="text-xl font-bold text-foreground">—</p>
                <p className="text-xs text-muted-foreground">No upcoming payments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty payment history */}
        <EmptyState
          icon={DollarSign}
          title="No payment history"
          description="Once you secure a sublet and make your first payment, your payment history will appear here."
          actionLabel="Browse Listings"
          onAction={() => window.location.href = "/listings"}
        />

        {/* Payment method placeholder */}
        <Card className="mt-6 shadow-card">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">No payment method on file</p>
                <p className="text-xs text-muted-foreground">Add a payment method when you're ready to secure a sublet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubtenantPaymentsPage;
