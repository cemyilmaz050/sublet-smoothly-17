import { motion } from "framer-motion";
import { Users, Search, ArrowRight } from "lucide-react";

interface FriendSubletPreScreenProps {
  onFriend: () => void;
  onMarketplace: () => void;
}

const FriendSubletPreScreen = ({ onFriend, onMarketplace }: FriendSubletPreScreenProps) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-lg space-y-8 text-center"
        >
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              Do you already have someone in mind?
            </h1>
            <p className="text-muted-foreground text-base">
              If you know who's taking over your place, we'll make it instant
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={onFriend}
              className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-border p-8 text-center transition-all hover:border-primary hover:bg-accent/50 hover:shadow-md"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Users className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">Yes, I know who I want</p>
                <p className="text-sm text-muted-foreground">
                  Send them a link and get it done in under 3 minutes
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Fast track <ArrowRight className="h-4 w-4" />
              </div>
            </button>

            <button
              onClick={onMarketplace}
              className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-border p-8 text-center transition-all hover:border-primary hover:bg-accent/50 hover:shadow-md"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform group-hover:scale-110">
                <Search className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-foreground">No — help me find someone</p>
                <p className="text-sm text-muted-foreground">
                  List your place and let subtenants come to you
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Create listing <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FriendSubletPreScreen;
