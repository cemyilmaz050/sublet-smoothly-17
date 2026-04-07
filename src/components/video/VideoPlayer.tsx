import { useState, useRef } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  videoUrl: string;
  tenantName?: string;
  verified?: boolean;
  memberSince?: string;
  className?: string;
  compact?: boolean; // small circular thumbnail mode
  onPlay?: () => void;
}

const VideoPlayer = ({
  videoUrl,
  tenantName,
  verified,
  memberSince,
  className,
  compact = false,
  onPlay,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play();
      setPlaying(true);
      setMuted(false);
      videoRef.current.muted = false;
      onPlay?.();
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const next = !muted;
    setMuted(next);
    videoRef.current.muted = next;
  };

  const handleEnded = () => {
    setPlaying(false);
    setMuted(true);
  };

  // Compact circular thumbnail mode (for listing cards)
  if (compact) {
    return (
      <div
        className={cn(
          "relative h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer group",
          className
        )}
        onClick={handlePlayToggle}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          muted={muted}
          playsInline
          onEnded={handleEnded}
          className="h-full w-full object-cover"
          preload="metadata"
        />
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-3.5 w-3.5 text-white fill-white" />
          </div>
        )}
      </div>
    );
  }

  // Full card mode (for listing detail)
  return (
    <div className={cn("relative overflow-hidden rounded-2xl bg-black", className)}>
      <video
        ref={videoRef}
        src={videoUrl}
        muted={muted}
        playsInline
        onEnded={handleEnded}
        className="w-full aspect-video object-cover"
        preload="metadata"
      />

      {/* Play overlay */}
      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 transition-colors hover:bg-black/30"
          onClick={handlePlayToggle}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-105">
            <Play className="h-7 w-7 text-foreground fill-foreground ml-1" />
          </div>
        </div>
      )}

      {/* Mute toggle when playing */}
      {playing && (
        <button
          onClick={handleMuteToggle}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      )}

      {/* Click to pause when playing */}
      {playing && (
        <div className="absolute inset-0 cursor-pointer" onClick={handlePlayToggle} />
      )}

      {/* Tenant info overlay */}
      {tenantName && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{tenantName}</p>
          </div>
          {memberSince && (
            <p className="text-xs text-white/70 mt-0.5">Member since {memberSince}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
