import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FinderQuestionnaire from "@/components/finder/FinderQuestionnaire";
import FinderLoading from "@/components/finder/FinderLoading";
import FinderSwipe from "@/components/finder/FinderSwipe";
import FinderCompare from "@/components/finder/FinderCompare";
import FinderAction from "@/components/finder/FinderAction";
import { FinderAnswers, ScoredListing } from "@/components/finder/types";
import { useFinderMatching } from "@/components/finder/useFinderMatching";

type FinderStep = "questions" | "loading" | "swipe" | "compare" | "action";

const AIFinderPage = () => {
  const [step, setStep] = useState<FinderStep>("questions");
  const [answers, setAnswers] = useState<FinderAnswers | null>(null);
  const [matchedListings, setMatchedListings] = useState<ScoredListing[]>([]);
  const [savedListings, setSavedListings] = useState<ScoredListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<ScoredListing | null>(null);
  const { matchListings } = useFinderMatching();

  const handleQuestionsComplete = useCallback(async (data: FinderAnswers) => {
    setAnswers(data);
    setStep("loading");

    const results = await matchListings(data);
    setMatchedListings(results);

    // Simulate AI processing feel
    setTimeout(() => {
      setStep("swipe");
    }, 2800);
  }, [matchListings]);

  const handleSwipeComplete = useCallback((saved: ScoredListing[]) => {
    setSavedListings(saved);
    if (saved.length >= 2) {
      setStep("compare");
    } else if (saved.length === 1) {
      setSelectedListing(saved[0]);
      setStep("action");
    }
  }, []);

  const handleBackToSwipe = useCallback(() => {
    setStep("swipe");
  }, []);

  const handleSelectListing = useCallback((listing: ScoredListing) => {
    setSelectedListing(listing);
    setStep("action");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        {step === "questions" && (
          <motion.div
            key="questions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
          >
            <FinderQuestionnaire onComplete={handleQuestionsComplete} />
          </motion.div>
        )}

        {step === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <FinderLoading />
          </motion.div>
        )}

        {step === "swipe" && (
          <motion.div
            key="swipe"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FinderSwipe
              listings={matchedListings}
              onComplete={handleSwipeComplete}
              answers={answers!}
            />
          </motion.div>
        )}

        {step === "compare" && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <FinderCompare
              listings={savedListings}
              answers={answers!}
              onSelect={handleSelectListing}
            />
          </motion.div>
        )}

        {step === "action" && selectedListing && (
          <motion.div
            key="action"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <FinderAction
              listing={selectedListing}
              answers={answers!}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIFinderPage;
