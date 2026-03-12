import { useCallback, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ListingFormData } from "@/types/listing";
import { ImagePlus, X } from "lucide-react";

interface Props {
  data: ListingFormData;
  onChange: (data: Partial<ListingFormData>) => void;
  errors: Record<string, string>;
}

const ListingStep2 = ({ data, onChange, errors }: Props) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const newFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
      const total = data.photos.length + newFiles.length;
      if (total > 10) {
        return; // max 10
      }
      onChange({ photos: [...data.photos, ...newFiles] });
    },
    [data.photos, onChange]
  );

  const removePhoto = (index: number) => {
    const updated = [...data.photos];
    updated.splice(index, 1);
    // Also remove from photoUrls if editing existing
    const updatedUrls = [...data.photoUrls];
    if (index < updatedUrls.length) {
      updatedUrls.splice(index, 1);
    }
    onChange({ photos: updated, photoUrls: updatedUrls });
  };

  const removeExistingPhoto = (index: number) => {
    const updatedUrls = [...data.photoUrls];
    updatedUrls.splice(index, 1);
    onChange({ photoUrls: updatedUrls });
  };

  const totalPhotos = data.photoUrls.length + data.photos.length;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-foreground">Photos & Description</h2>

      <div>
        <Label>Photos * (minimum 3, maximum 10) — {totalPhotos}/10 uploaded</Label>
        <div
          className={`mt-1.5 flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
            dragActive ? "border-primary bg-accent/50" : "border-border hover:border-primary/50"
          }`}
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => document.getElementById("photo-upload")?.click()}
        >
          <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Drag & drop photos here or click to browse</p>
          <input
            id="photo-upload"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
        {errors.photos && <p className="mt-1 text-sm text-destructive">{errors.photos}</p>}

        {(data.photoUrls.length > 0 || data.photos.length > 0) && (
          <div className="mt-3 grid grid-cols-5 gap-2">
            {data.photoUrls.map((url, i) => (
              <div key={`url-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeExistingPhoto(i); }}
                  className="absolute right-1 top-1 rounded-full bg-destructive p-1 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3 text-destructive-foreground" />
                </button>
              </div>
            ))}
            {data.photos.map((file, i) => (
              <div key={`file-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border">
                <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                  className="absolute right-1 top-1 rounded-full bg-destructive p-1 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3 text-destructive-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="headline">Headline * ({data.headline.length}/60)</Label>
        <Input
          id="headline"
          placeholder="Sunny 2BR in Downtown"
          maxLength={60}
          className="mt-1.5"
          value={data.headline}
          onChange={(e) => onChange({ headline: e.target.value })}
        />
        {errors.headline && <p className="mt-1 text-sm text-destructive">{errors.headline}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description * ({data.description.length}/500)</Label>
        <Textarea
          id="description"
          placeholder="Describe your space, neighborhood, and what makes it special..."
          maxLength={500}
          rows={4}
          className="mt-1.5"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
        {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description}</p>}
      </div>
    </div>
  );
};

export default ListingStep2;
