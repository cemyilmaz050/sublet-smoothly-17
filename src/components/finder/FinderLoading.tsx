import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const rotatingMessages = [
  "Checking locations near your school",
  "Matching your budget",
  "Checking available dates",
  "Reviewing amenities",
  "Almost there",
];

const housePathData =
  "M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z";

const FinderLoading = () => {
  const [progress, setProgress] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 1.2, 100));
    }, 30);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % rotatingMessages.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-10 text-center">
        {/* Animated SVG house that draws itself */}
        <div className="mx-auto flex items-center justify-center">
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            className="text-primary"
          >
            <motion.path
              d={housePathData}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2.2, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-foreground leading-tight">
          Finding your perfect Boston summer home
        </h2>

        {/* Progress bar */}
        <div className="space-y-4">
          <Progress value={progress} className="h-1.5" />

          {/* Rotating messages */}
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-sm text-muted-foreground"
          >
            {rotatingMessages[msgIndex]}
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default FinderLoading;
