import { CheckCircle2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface VerificationSuccessScreenProps {
  open: boolean;
  onClose: () => void;
}

const VerificationSuccessScreen = ({ open, onClose }: VerificationSuccessScreenProps) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex flex-col items-center gap-4 py-6"
        >
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald/20">
              <CheckCircle2 className="h-10 w-10 text-emerald" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="absolute -right-2 -top-2"
            >
              <span className="text-3xl">🎉</span>
            </motion.div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">You're fully verified on SubIn!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You can now schedule viewings and secure places across the platform. Welcome to the community! 🏠
            </p>
          </div>
          <Button onClick={onClose} className="w-full mt-2">
            Let's go! 🚀
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationSuccessScreen;
