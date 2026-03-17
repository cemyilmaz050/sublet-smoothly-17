import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, GripVertical, Star, Upload, X, CheckCircle2, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

/* ─── Types ─── */
export interface UploadingPhoto {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "uploading" | "done" | "error";
  resultUrl?: string;
  fingerprint: string;
}

interface UniversalPhotoUploaderProps {
  photoUrls: string[];
  onPhotoUrlsChange: (urls: string[]) => void;
  bucket?: string;
  storagePath?: string;
  maxPhotos?: number;
  minPhotos?: number;
  showCoverBadge?: boolean;
  compact?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = /\.(jpg|jpeg|png|heic|webp)$/i;

/* ─── Fingerprinting: name + size + quick pixel hash ─── */
function fileFingerprint(file: File): string {
  return `${file.size}_${file.name.replace(/\s+/g, "").toLowerCase()}`;
}

async function imageContentHash(file: File): Promise<string> {
  try {
    const buf = await file.slice(0, Math.min(file.size, 8192)).arrayBuffer();
    const arr = new Uint8Array(buf);
    let h = 0;
    for (let i = 0; i < arr.length; i++) {
      h = ((h << 5) - h + arr[i]) | 0;
    }
    return `${file.size}_${h}`;
  } catch {
    return fileFingerprint(file);
  }
}

/* ─── Detect duplicate URLs by normalised path ─── */
function urlFingerprint(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.split("/").pop()?.toLowerCase() || url;
  } catch {
    return url;
  }
}

function findDuplicateUrls(urls: string[]): { unique: string[]; dupeCount: number } {
  const seen = new Set<string>();
  const unique: string[] = [];
  let dupeCount = 0;
  for (const url of urls) {
    const fp = urlFingerprint(url);
    if (seen.has(fp)) {
      dupeCount++;
    } else {
      seen.add(fp);
      unique.push(url);
    }
  }
  return { unique, dupeCount };
}

const UniversalPhotoUploader = ({
  photoUrls,
  onPhotoUrlsChange,
  bucket = "listing-photos",
  storagePath = "uploads",
  maxPhotos = 15,
  minPhotos = 0,
  showCoverBadge = true,
  compact = false,
}: UniversalPhotoUploaderProps) => {
  const [uploading, setUploading] = useState<UploadingPhoto[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [allDoneFlash, setAllDoneFlash] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [similarWarnings, setSimilarWarnings] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionFingerprintsRef = useRef<Set<string>>(new Set());
  const flushedRef = useRef(false);
  const photoUrlsRef = useRef(photoUrls);
  photoUrlsRef.current = photoUrls;
  const onChangeRef = useRef(onPhotoUrlsChange);
  onChangeRef.current = onPhotoUrlsChange;

  const total = photoUrls.length + uploading.filter((u) => u.status !== "error").length;
  const remaining = maxPhotos - total;

  const uploadedCount = uploading.filter((u) => u.status === "done").length;
  const activeCount = uploading.filter((u) => u.status === "uploading").length;

  const overallProgress = useMemo(() => {
    if (uploading.length === 0) return 0;
    return uploading.reduce((sum, u) => sum + u.progress, 0) / uploading.length;
  }, [uploading]);

  // Check for duplicate URLs already in photoUrls
  const hasDuplicateUrls = useMemo(() => {
    const { dupeCount } = findDuplicateUrls(photoUrls);
    return dupeCount > 0;
  }, [photoUrls]);

  // Flash "all done" when uploads complete — use flushedRef to prevent double-firing
  useEffect(() => {
    if (uploading.length > 0 && activeCount === 0 && !flushedRef.current) {
      const doneUrls = uploading
        .filter((u) => u.status === "done" && u.resultUrl)
        .map((u) => u.resultUrl!);
      if (doneUrls.length > 0) {
        flushedRef.current = true;
        onChangeRef.current([...photoUrlsRef.current, ...doneUrls]);
        setAllDoneFlash(true);
        setTimeout(() => {
          setUploading([]);
          setAllDoneFlash(false);
        }, 1500);
      }
    }
  }, [activeCount, uploading]);

  const uploadFile = useCallback(
    async (file: File, uploadId: string) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${storagePath}/${crypto.randomUUID()}.${ext}`;

      const progressInterval = setInterval(() => {
        setUploading((prev) =>
          prev.map((u) =>
            u.id === uploadId && u.status === "uploading"
              ? { ...u, progress: Math.min(u.progress + Math.random() * 15, 90) }
              : u
          )
        );
      }, 200);

      try {
        const { error } = await supabase.storage.from(bucket).upload(path, file);
        clearInterval(progressInterval);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

        setUploading((prev) =>
          prev.map((u) =>
            u.id === uploadId
              ? { ...u, progress: 100, status: "done", resultUrl: urlData.publicUrl }
              : u
          )
        );
      } catch (err: any) {
        clearInterval(progressInterval);
        console.error("Upload error:", err);
        setUploading((prev) =>
          prev.map((u) =>
            u.id === uploadId ? { ...u, status: "error", progress: 0 } : u
          )
        );
        toast.error(`Failed to upload ${file.name}`);
      }
    },
    [bucket, storagePath]
  );

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files);
      const valid: File[] = [];

      for (const f of fileArr) {
        if (f.size > MAX_FILE_SIZE) {
          toast.error(`"${f.name}" is too large — please use a photo under 10MB`);
          continue;
        }
        if (!f.type.startsWith("image/") && !ACCEPTED_EXTENSIONS.test(f.name)) {
          toast.error(`"${f.name}" is not a supported image format`);
          continue;
        }
        valid.push(f);
      }

      if (remaining <= 0) {
        toast.error(`You've reached the maximum of ${maxPhotos} photos — remove some before adding more`);
        return;
      }

      // Deduplicate against session
      const deduplicated: File[] = [];
      let skipped = 0;
      const newFingerprints = new Set(sessionFingerprintsRef.current);

      for (const f of valid) {
        const contentFp = await imageContentHash(f);
        const simpleFp = fileFingerprint(f);
        if (newFingerprints.has(contentFp) || newFingerprints.has(simpleFp)) {
          skipped++;
          continue;
        }
        newFingerprints.add(contentFp);
        newFingerprints.add(simpleFp);
        deduplicated.push(f);
      }

      if (skipped > 0) {
        toast.info(`${skipped} duplicate photo${skipped > 1 ? "s were" : " was"} skipped — we only kept the unique ones`);
      }

      setSessionFingerprints(newFingerprints);

      const toAdd = deduplicated.slice(0, Math.max(0, remaining));
      if (toAdd.length < deduplicated.length) {
        toast.error(`Only ${remaining} more photo${remaining !== 1 ? "s" : ""} can be added`);
      }
      if (toAdd.length === 0) return;

      const newUploads: UploadingPhoto[] = toAdd.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: "uploading" as const,
        fingerprint: fileFingerprint(file),
      }));

      setUploading((prev) => [...prev, ...newUploads]);
      newUploads.forEach((u) => uploadFile(u.file, u.id));
    },
    [remaining, uploadFile, sessionFingerprints, maxPhotos]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(e.target.files);
      e.target.value = "";
    },
    [processFiles]
  );

  const removeUrl = (index: number) => {
    setSimilarWarnings((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
    onPhotoUrlsChange(photoUrls.filter((_, i) => i !== index));
  };

  const removeUploading = (id: string) => {
    setUploading((prev) => {
      const item = prev.find((u) => u.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((u) => u.id !== id);
    });
  };

  const removeDuplicateUrls = () => {
    const { unique, dupeCount } = findDuplicateUrls(photoUrls);
    if (dupeCount === 0) {
      toast.info("No duplicate photos found");
      return;
    }
    onPhotoUrlsChange(unique);
    toast.success(`Removed ${dupeCount} duplicate photo${dupeCount > 1 ? "s" : ""} — your listing now has ${unique.length} unique photos`);
  };

  const dismissSimilar = (index: number) => {
    setSimilarWarnings((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  // Reorder
  const handleReorderDragStart = (idx: number) => setDragIdx(idx);
  const handleReorderDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleReorderDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) return;
    const newUrls = [...photoUrls];
    const [moved] = newUrls.splice(dragIdx, 1);
    newUrls.splice(idx, 0, moved);
    onPhotoUrlsChange(newUrls);
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleReorderDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="space-y-4">
      {/* Remove duplicates button */}
      {hasDuplicateUrls && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={removeDuplicateUrls}
          className="w-full gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
        >
          <Trash2 className="h-4 w-4" />
          Remove duplicate photos
        </Button>
      )}

      {/* Upload progress bar */}
      {uploading.length > 0 && activeCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{uploadedCount} of {uploading.length} uploaded</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-1.5" />
        </div>
      )}

      {/* All done flash */}
      {allDoneFlash && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          All photos uploaded
        </div>
      )}

      {/* Drop zone */}
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed transition-all duration-200",
          compact ? "p-4" : "p-8",
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01] shadow-lg"
            : "border-border hover:border-primary/40 hover:bg-accent/30"
        )}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-full transition-colors",
            compact ? "h-10 w-10" : "h-14 w-14",
            dragOver ? "bg-primary/10" : "bg-accent"
          )}
        >
          {dragOver ? (
            <Upload className={cn("text-primary", compact ? "h-5 w-5" : "h-7 w-7")} />
          ) : (
            <Camera className={cn("text-primary", compact ? "h-5 w-5" : "h-7 w-7")} />
          )}
        </div>
        <div className="text-center">
          <p className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>
            {dragOver ? "Drop photos here" : "Drag photos here or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            JPG, PNG, HEIC, WEBP · Max 10MB each · Up to {maxPhotos} photos
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/heic,image/webp"
          capture="environment"
          className="hidden"
          onChange={handleFileInput}
        />
      </label>

      {/* Photo grid */}
      {(photoUrls.length > 0 || uploading.length > 0) && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {photoUrls.map((url, i) => (
            <div
              key={`url-${i}`}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-muted cursor-grab transition-all",
                dragOverIdx === i && "ring-2 ring-primary scale-105"
              )}
              draggable
              onDragStart={() => handleReorderDragStart(i)}
              onDragOver={(e) => handleReorderDragOver(e, i)}
              onDrop={() => handleReorderDrop(i)}
              onDragEnd={handleReorderDragEnd}
            >
              <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
              {showCoverBadge && i === 0 && (
                <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  <Star className="h-3 w-3" /> Cover
                </div>
              )}
              {similarWarnings.has(i) && (
                <div className="absolute left-1 bottom-7 flex items-center gap-1 rounded bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-medium text-white">
                  <AlertTriangle className="h-3 w-3" /> Similar
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); dismissSimilar(i); }}
                    className="ml-0.5 hover:text-amber-200"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute left-1 bottom-1 opacity-0 group-hover:opacity-70 transition-opacity">
                <GripVertical className="h-4 w-4 text-white" />
              </div>
              <button
                type="button"
                onClick={() => removeUrl(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/60 text-background opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}

          {uploading.map((u) => (
            <div key={u.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
              <img
                src={u.previewUrl}
                alt=""
                className={cn(
                  "h-full w-full object-cover transition-opacity duration-500",
                  u.status === "uploading" ? "opacity-70" : "opacity-100"
                )}
              />
              {u.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity">
                  <div className="relative h-10 w-10">
                    <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray={`${u.progress * 0.975} 97.5`} strokeLinecap="round" className="transition-all duration-300" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">{Math.round(u.progress)}%</span>
                  </div>
                </div>
              )}
              {u.status === "done" && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 animate-fade-out">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
              )}
              {u.status === "error" && (
                <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                  <span className="text-[10px] font-medium text-destructive">Failed</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeUploading(u.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/60 text-background opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Counter */}
      <p
        className={cn(
          "text-center text-xs",
          photoUrls.length >= minPhotos ? "text-muted-foreground" : "text-destructive"
        )}
      >
        {photoUrls.length + uploading.filter((u) => u.status !== "error").length} of {maxPhotos} photos used
        {minPhotos > 0 && photoUrls.length < minPhotos && ` · ${minPhotos} minimum required`}
      </p>
    </div>
  );
};

export default UniversalPhotoUploader;
