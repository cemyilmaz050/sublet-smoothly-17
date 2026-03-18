import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Video, Square, RotateCcw, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface VideoRecorderProps {
  onVideoUploaded: (url: string) => void;
  onSkip?: () => void;
  maxDuration?: number;
  bucket?: string;
  storagePath?: string;
}

const VideoRecorder = ({
  onVideoUploaded,
  onSkip,
  maxDuration = 60,
  bucket = "intro-videos",
  storagePath,
}: VideoRecorderProps) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<"idle" | "recording" | "preview" | "uploading" | "done">("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setStream(ms);
      if (videoRef.current) {
        videoRef.current.srcObject = ms;
        videoRef.current.play();
      }
      startRecording(ms);
    } catch (err) {
      toast.error("Camera access denied. Please allow camera and microphone access.");
    }
  };

  const startRecording = (ms: MediaStream) => {
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "video/mp4";

    const mr = new MediaRecorder(ms, { mimeType });
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      setState("preview");
      ms.getTracks().forEach((t) => t.stop());
      setStream(null);
      if (previewRef.current) {
        previewRef.current.src = URL.createObjectURL(blob);
      }
    };
    mediaRecorderRef.current = mr;
    mr.start(1000);
    setState("recording");
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= maxDuration) {
          stopRecording();
          return maxDuration;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
  };

  const recordAgain = () => {
    setRecordedBlob(null);
    setState("idle");
    setElapsed(0);
  };

  const uploadVideo = async () => {
    if (!recordedBlob || !user) return;
    setState("uploading");
    try {
      const ext = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
      const path = storagePath || `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, recordedBlob, {
        contentType: recordedBlob.type,
        upsert: true,
      });
      if (error) throw error;

      // Generate signed URL (valid for 1 year)
      const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
      if (!signedData?.signedUrl) throw new Error("Failed to generate video URL");

      setState("done");
      onVideoUploaded(signedData.signedUrl);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload video");
      setState("preview");
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (state === "done") {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald/10">
          <Check className="h-8 w-8 text-emerald" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Video added!</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          Your introduction video has been added — sub-lessees will see your face before they ever knock
        </p>
      </div>
    );
  }

  if (state === "preview" || state === "uploading") {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-black aspect-video">
          <video
            ref={previewRef}
            src={recordedBlob ? URL.createObjectURL(recordedBlob) : undefined}
            controls
            className="h-full w-full object-cover"
            playsInline
          />
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={recordAgain} disabled={state === "uploading"} className="rounded-full">
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Record Again
          </Button>
          <Button onClick={uploadVideo} disabled={state === "uploading"} className="rounded-full">
            {state === "uploading" ? (
              <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Uploading...</>
            ) : (
              <><Check className="mr-1.5 h-4 w-4" /> Use This Video</>
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (state === "recording") {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-black aspect-video">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover mirror" />
          <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
            <span className="text-xs font-medium text-white">{formatTime(elapsed)} / {formatTime(maxDuration)}</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div className="h-full bg-destructive transition-all" style={{ width: `${(elapsed / maxDuration) * 100}%` }} />
          </div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={stopRecording}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-white shadow-lg transition-transform hover:scale-105"
          >
            <Square className="h-6 w-6 fill-current" />
          </button>
        </div>
      </div>
    );
  }

  // idle state
  return (
    <div className="flex flex-col items-center py-6">
      <button
        onClick={startCamera}
        className="group mb-6 flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-primary/30 bg-primary/5 transition-all hover:border-primary hover:bg-primary/10"
      >
        <Video className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
      </button>
      <p className="text-sm text-muted-foreground mb-6">Tap to start recording (max {maxDuration}s)</p>

      <div className="w-full max-w-sm space-y-3 mb-6">
        {[
          "Tell us your name and where you're going this summer",
          "Show us around your apartment briefly",
          "Tell sub-lessees one thing you love about the place",
        ].map((prompt, i) => (
          <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {i + 1}
            </span>
            {prompt}
          </div>
        ))}
      </div>

      {onSkip && (
        <button onClick={onSkip} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">
          Skip for now
        </button>
      )}
    </div>
  );
};

export default VideoRecorder;
