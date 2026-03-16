import { motion } from "framer-motion";
import { Users, CheckCircle, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

interface Applicant {
  id: string;
  name: string;
  initial: string;
  verified: boolean;
  renter_verified?: boolean;
  listing_headline: string;
  listing_address: string;
  message: string | null;
  status: string;
  created_at: string;
}

interface Props {
  applicants: Applicant[];
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
}

const RecentApplicants = ({ applicants, onAccept, onDecline }: Props) => {
  const [profileDrawer, setProfileDrawer] = useState<Applicant | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground">Recent Applicants</h2>
          {applicants.length > 0 && (
            <Badge variant="outline" className="text-xs">{applicants.length}</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="text-primary text-sm">View All</Button>
      </div>

      {applicants.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <Users className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No applicants yet</p>
          <p className="mt-1 text-xs text-muted-foreground">When subtenants apply to your listings, they'll appear here.</p>
        </div>
      ) : (
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {applicants.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-[260px] shrink-0 rounded-xl border bg-card p-4 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {app.initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-foreground truncate">{app.name}</p>
                      {app.verified && <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{app.listing_address}</p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Applied {new Date(app.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setProfileDrawer(app)}>
                    View Profile
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* Profile Drawer */}
      <Sheet open={!!profileDrawer} onOpenChange={(o) => !o && setProfileDrawer(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Applicant Profile</SheetTitle>
          </SheetHeader>
          {profileDrawer && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {profileDrawer.initial}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-semibold text-foreground">{profileDrawer.name}</h3>
                    {profileDrawer.verified && <CheckCircle className="h-4 w-4 text-emerald" />}
                  </div>
                  <p className="text-sm text-muted-foreground">Applied for {profileDrawer.listing_headline}</p>
                </div>
              </div>

              {profileDrawer.message && (
                <div className="rounded-lg bg-accent/50 p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Application Note</p>
                  <p className="text-sm text-foreground">{profileDrawer.message}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => { onAccept?.(profileDrawer.id); setProfileDrawer(null); }}>
                  Accept Application
                </Button>
                <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10" onClick={() => { onDecline?.(profileDrawer.id); setProfileDrawer(null); }}>
                  Decline
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default RecentApplicants;
