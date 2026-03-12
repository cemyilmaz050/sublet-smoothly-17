import { CheckCircle, AlertTriangle } from "lucide-react";
import { ListingFormData } from "@/types/listing";
import { cn } from "@/lib/utils";

interface Props {
  data: ListingFormData;
  onGoToStep: (step: number) => void;
}

const PublishChecklist = ({ data, onGoToStep }: Props) => {
  const totalPhotos = data.photoUrls.length + data.photos.length;

  const items = [
    {
      label: "Property details complete",
      done: !!data.address && !!data.property_type && data.bedrooms !== "" && data.bathrooms !== "",
      step: 0,
    },
    {
      label: `Photos uploaded${totalPhotos > 0 ? ` (${totalPhotos})` : ""}`,
      done: totalPhotos >= 3,
      step: 1,
    },
    {
      label: "Pricing set",
      done: data.monthly_rent !== "" && Number(data.monthly_rent) > 0,
      step: 2,
    },
    {
      label: "Availability dates selected",
      done: !!data.available_from && !!data.available_until,
      step: 2,
    },
    {
      label: "House rules added",
      done: !!data.guest_policy,
      step: 3,
    },
    {
      label: "Description & headline written",
      done: !!data.headline.trim() && !!data.description.trim(),
      step: 1,
    },
  ];

  const allDone = items.every((i) => i.done);

  return { items, allDone, ChecklistUI: (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <h3 className="font-semibold text-foreground text-sm">Publishing Checklist</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              item.done ? "bg-emerald/5 text-foreground" : "bg-amber/5 text-foreground"
            )}
          >
            {item.done ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber" />
            )}
            <span className="flex-1">{item.label}</span>
            {!item.done && (
              <button
                onClick={() => onGoToStep(item.step)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Complete this step
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )};
};

export default PublishChecklist;
