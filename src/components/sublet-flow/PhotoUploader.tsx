import { Camera, X, Star } from "lucide-react";
import { useCallback } from "react";

interface PhotoUploaderProps {
  photos: File[];
  photoUrls: string[];
  onPhotosChange: (photos: File[]) => void;
  onPhotoUrlsChange: (urls: string[]) => void;
}

const PhotoUploader = ({ photos, photoUrls, onPhotosChange, onPhotoUrlsChange }: PhotoUploaderProps) => {
  const total = photos.length + photoUrls.length;

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(
      (f) => f.size <= 10 * 1024 * 1024 && /\.(jpg|jpeg|png|heic|webp)$/i.test(f.name)
    );
    const remaining = 10 - total;
    const toAdd = valid.slice(0, remaining);
    if (toAdd.length > 0) onPhotosChange([...photos, ...toAdd]);
  }, [photos, total, onPhotosChange]);

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const removeUrl = (index: number) => {
    onPhotoUrlsChange(photoUrls.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <label
        className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border p-8 transition-colors hover:border-primary/40 hover:bg-accent/30"
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files); }}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent">
          <Camera className="h-7 w-7 text-primary" />
        </div>
        <p className="text-sm font-medium text-foreground">Drag photos here or click to browse</p>
        <p className="text-xs text-muted-foreground">JPG, PNG, HEIC · Max 10MB each · Up to 10 photos</p>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/heic,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {/* Photo grid */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {photoUrls.map((url, i) => (
            <div key={`url-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <img src={url} alt="" className="h-full w-full object-cover" />
              {i === 0 && photos.length === 0 && (
                <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  <Star className="h-3 w-3" /> Cover
                </div>
              )}
              <button onClick={() => removeUrl(i)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/60 text-background opacity-0 transition-opacity group-hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {photos.map((file, i) => (
            <div key={`file-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
              {i === 0 && photoUrls.length === 0 && (
                <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  <Star className="h-3 w-3" /> Cover
                </div>
              )}
              <button onClick={() => removePhoto(i)} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/60 text-background opacity-0 transition-opacity group-hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">{total} / 10 photos added</p>
    </div>
  );
};

export default PhotoUploader;
