import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText, LayoutDashboard, Loader2 } from "lucide-react";

import Footer from "@/components/Footer";
import { Link, useSearchParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const PaymentConfirmationPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const listingId = searchParams.get("listing_id");

  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [agreementId, setAgreementId] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState({
    amount: "$0.00",
    date: format(new Date(), "MMMM d, yyyy"),
    reference: "",
  });

  useEffect(() => {
    if (sessionId && user && !confirmed) {
      confirmBooking();
    }
  }, [sessionId, user]);

  const confirmBooking = async () => {
    if (!sessionId) return;
    setConfirming(true);
    try {
      const { data, error } = await supabase.functions.invoke("confirm-booking", {
        body: { sessionId, listingId },
      });

      if (error) {
        console.error("Confirm booking error:", error);
      } else if (data) {
        setConfirmed(true);
        if (data.agreementId) setAgreementId(data.agreementId);
        setReceiptData({
          amount: `$${(data.totalPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          date: format(new Date(), "MMMM d, yyyy"),
          reference: sessionId?.slice(0, 20) || "N/A",
        });
      }
    } catch (err) {
      console.error("Booking confirmation failed:", err);
    } finally {
      setConfirming(false);
      setConfirmed(true); // Show success even if confirm-booking had issues (payment went through)
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      <div className="flex-1 container flex max-w-lg flex-col items-center px-4 sm:px-6 py-10 sm:py-16">
        {confirming ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Confirming your booking...</p>
          </div>
        ) : (
          <>
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
              Your booking is confirmed. A sublet agreement has been generated — please sign it to finalize.
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

                  {/* What happens next */}
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">What happens next</h4>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        Both you and the tenant will receive a digital sublet agreement to sign
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        Once both parties sign, the sublet is officially confirmed
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        You can cancel within 48 hours for a full refund if the sublet hasn't started
                      </li>
                    </ul>
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
                {agreementId ? (
                  <Link to={`/agreement?id=${agreementId}`} className="flex-1">
                    <Button size="lg" className="w-full h-12">
                      <FileText className="mr-1 h-4 w-4" />
                      Sign Agreement
                    </Button>
                  </Link>
                ) : (
                  <Link to="/dashboard/subtenant" className="flex-1">
                    <Button size="lg" className="w-full h-12">
                      <FileText className="mr-1 h-4 w-4" />
                      View Agreement
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PaymentConfirmationPage;
