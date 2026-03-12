import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  dotColor: string;
}

const StatCard = ({ label, value, subtext, dotColor }: StatCardProps) => (
  <Card className="shadow-card">
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
    </CardContent>
  </Card>
);

interface Props {
  activeListings: number;
  totalApplicants: number;
  unreadMessages: number;
  earningsThisMonth: number;
}

const DashboardStats = ({ activeListings, totalApplicants, unreadMessages, earningsThisMonth }: Props) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {[
      { label: "Active Listings", value: String(activeListings), subtext: "Properties currently live", dotColor: "bg-emerald" },
      { label: "Total Applicants", value: String(totalApplicants), subtext: "People interested in your places", dotColor: "bg-primary" },
      { label: "Unread Messages", value: String(unreadMessages), subtext: "New messages waiting", dotColor: unreadMessages > 0 ? "bg-cyan" : "bg-muted" },
      { label: "Earnings This Month", value: `$${earningsThisMonth.toLocaleString()}`, subtext: "From active sublets", dotColor: "bg-emerald" },
    ].map((s, i) => (
      <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
        <StatCard {...s} />
      </motion.div>
    ))}
  </div>
);

export default DashboardStats;
