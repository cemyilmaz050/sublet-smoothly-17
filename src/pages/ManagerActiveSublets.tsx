import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, CheckCircle2, Clock, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import EmptyState from "@/components/EmptyState";

// Mock data for active sublets
const mockSublets = [
  {
    id: "1",
    property: "123 Main St",
    unit: "4B",
    tenant: "Sarah Johnson",
    subtenant: "Alex Rivera",
    startDate: "2026-01-15",
    endDate: "2026-07-15",
    rent: 2400,
    paymentStatus: "up_to_date",
    daysRemaining: 125,
  },
  {
    id: "2",
    property: "456 Oak Ave",
    unit: "2A",
    tenant: "Mike Chen",
    subtenant: "Jordan Lee",
    startDate: "2026-02-01",
    endDate: "2026-08-01",
    rent: 1800,
    paymentStatus: "overdue",
    daysRemaining: 142,
  },
];

const ManagerActiveSublets = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link to="/dashboard/manager">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Active Sublets</h1>
            <p className="text-sm text-muted-foreground">Monitor all currently running sublets</p>
          </div>
        </div>

        {mockSublets.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No active sublets"
            description="Active sublets across your properties will appear here."
          />
        ) : (
          <Card className="shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Subtenant</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Rent</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Days Left</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSublets.map((sublet) => (
                    <TableRow key={sublet.id}>
                      <TableCell className="font-medium">{sublet.property}</TableCell>
                      <TableCell>{sublet.unit}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent">
                            <User className="h-3.5 w-3.5 text-accent-foreground" />
                          </div>
                          {sublet.tenant}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {sublet.subtenant}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(sublet.startDate).toLocaleDateString()} — {new Date(sublet.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold">${sublet.rent.toLocaleString()}/mo</TableCell>
                      <TableCell>
                        <Badge variant={sublet.paymentStatus === "up_to_date" ? "emerald" : "rejected"}>
                          {sublet.paymentStatus === "up_to_date" ? (
                            <><CheckCircle2 className="mr-1 h-3 w-3" />Up to Date</>
                          ) : (
                            <><Clock className="mr-1 h-3 w-3" />Overdue</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">{sublet.daysRemaining} days</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ManagerActiveSublets;
