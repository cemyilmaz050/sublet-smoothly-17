import { motion } from "framer-motion";
import { Home } from "lucide-react";

const FinderLoading = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <motion.div
        className="text-center space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Animated door */}
        <div className="relative mx-auto w-32 h-40">
          <motion.div
            className="absolute inset-0 rounded-t-3xl bg-primary/20 border-2 border-primary/30"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: [1, 0.85, 1, 0.9, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "left center" }}
          />
          <motion.div
            className="absolute top-1/2 right-6 w-3 h-3 rounded-full bg-primary"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Home className="h-8 w-8 text-primary" />
          </motion.div>
        </div>

        <div className="space-y-3">
          <motion.h2
            className="text-2xl font-bold text-foreground"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Finding your perfect Boston summer home... 🏠
          </motion.h2>
          <p className="text-muted-foreground">
            Matching your preferences with available listings
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-primary"
              animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default FinderLoading;
