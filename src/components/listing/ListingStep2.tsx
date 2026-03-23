import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ListingFormData } from "@/types/listing";
import UniversalPhotoUploader from "@/components/UniversalPhotoUploader";

interface Props {
  data: ListingFormData;
  onChange: (data: Partial<ListingFormData>) => void;
  errors: Record<string, string>;
}

const ListingStep2 = ({ data, onChange, errors }: Props) => {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-foreground">Photos & Description</h2>

      <div>
        <Label>Photos * (minimum 3, maximum 15)</Label>
        <div className="mt-1.5">
          <UniversalPhotoUploader
            photoUrls={data.photoUrls}
            onPhotoUrlsChange={(urls) => onChange({ photoUrls: urls })}
            bucket="listing-photos"
            storagePath={`listings/${crypto.randomUUID()}`}
            maxPhotos={15}
            minPhotos={3}
            showCoverBadge
          />
        </div>
        {errors.photos && <p className="mt-1 text-sm text-destructive">{errors.photos}</p>}
      </div>

      <div>
        <Label htmlFor="headline">Headline * ({data.headline.length}/60)</Label>
        <Input
          id="headline"
          placeholder="Sunny 2BR in Downtown"
          maxLength={60}
          className="mt-1.5 text-base"
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
          className="mt-1.5 text-base"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
        {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description}</p>}
      </div>
    </div>
  );
};

export default ListingStep2;
