import { useState } from "react";
import { Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VideoRecorder from "./VideoRecorder";

interface VideoPromptProps {
  message: string;
  onVideoUploaded: (url: string) => void;
  onDismiss?: () => void;
}

const VideoPrompt = ({ message, onVideoUploaded, onDismiss }: VideoPromptProps) => {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Video className="h-4.5 w-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">{message}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <Button size="sm" className="rounded-full" onClick={() => setOpen(true)}>
              <Video className="mr-1.5 h-3.5 w-3.5" />
              Record Video
            </Button>
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => { setDismissed(true); onDismiss?.(); }}
            >
              Not now
            </button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record your introduction</DialogTitle>
          </DialogHeader>
          <VideoRecorder
            onVideoUploaded={(url) => {
              onVideoUploaded(url);
              setOpen(false);
              setDismissed(true);
            }}
            onSkip={() => { setOpen(false); setDismissed(true); }}
            maxDuration={30}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VideoPrompt;
