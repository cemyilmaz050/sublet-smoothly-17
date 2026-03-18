import VideoRecorder from "@/components/video/VideoRecorder";

interface Props {
  videoUrl: string | null;
  onVideoUploaded: (url: string) => void;
  onSkip: () => void;
}

const ListingStepVideo = ({ videoUrl, onVideoUploaded, onSkip }: Props) => {
  if (videoUrl) {
    return (
      <div className="space-y-5">
        <h2 className="text-xl font-semibold text-foreground">Introduce Yourself</h2>
        <p className="text-sm text-muted-foreground">
          Your introduction video has been added — sub-lessees will see your face before they ever knock
        </p>
        <div className="rounded-2xl overflow-hidden bg-black aspect-video">
          <video src={videoUrl} controls playsInline className="h-full w-full object-cover" />
        </div>
        <button
          onClick={() => onVideoUploaded("")}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Remove and record again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-foreground">Introduce Yourself</h2>
      <p className="text-sm text-muted-foreground">
        A short video makes sub-lessees 3x more likely to reach out — takes 30 seconds
      </p>
      <VideoRecorder
        onVideoUploaded={onVideoUploaded}
        onSkip={onSkip}
        maxDuration={60}
      />
    </div>
  );
};

export default ListingStepVideo;
