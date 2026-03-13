import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, LayoutDashboard } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const PaymentConfirmationPage = () => {
  const receiptData = {
    amount: "$5,150.00",
    date: "March 12, 2026",
    reference: "TXN-2026-00847",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container flex max-w-lg flex-col items-center px-4 sm:px-6 py-10 sm:py-16">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mb-5 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-emerald/15"
        >
          <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-emerald" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-2 text-xl sm:text-2xl font-bold text-foreground text-center"
        >
          Payment Successful!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6 sm:mb-8 text-center text-sm sm:text-base text-muted-foreground px-2"
        >
          Your agreement is now active. Move-in details have been sent to your email.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full"
        >
          <Card className="mb-6 sm:mb-8 shadow-card">
            <CardContent className="space-y-3 p-4 sm:p-6">
              <h3 className="font-semibold text-foreground">Receipt</h3>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-medium text-foreground">{receiptData.amount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium text-foreground">{receiptData.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono text-xs sm:text-sm text-foreground break-all">{receiptData.reference}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/dashboard/subtenant" className="flex-1">
              <Button variant="outline" size="lg" className="w-full h-12">
                <LayoutDashboard className="mr-1 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>
            <Link to="/dashboard/subtenant" className="flex-1">
              <Button size="lg" className="w-full h-12">
                <FileText className="mr-1 h-4 w-4" />
                View Agreement
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentConfirmationPage;
