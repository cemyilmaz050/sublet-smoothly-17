import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Clock, Calendar, Pencil } from "lucide-react";
import Navbar from "@/components/Navbar";
import PlatformFeeTooltip from "@/components/PlatformFeeTooltip";
import EmptyState from "@/components/EmptyState";
import { Link } from "react-router-dom";

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
                <p className="text-xl font-bold text-foreground">$0.00</p>
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
                <p className="text-xl font-bold text-foreground">$0.00</p>
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
                <p className="text-xl font-bold text-foreground">—</p>
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
          <PlatformFeeTooltip amount={0} />
        </div>

        {/* Empty state */}
        <EmptyState
          icon={DollarSign}
          title="No payouts yet"
          description="Once a subtenant makes a payment for your listing, your earnings will appear here."
        />

        {/* Edit Payout */}
        <Link to="/pricing-setup" className="mt-6 block">
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
