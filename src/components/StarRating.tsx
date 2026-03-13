import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  count?: number;
  showCount?: boolean;
}

const sizeMap = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const StarRating = ({
  rating,
  max = 5,
  size = "sm",
  interactive = false,
  onChange,
  count,
  showCount = false,
}: StarRatingProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={cn(
              "p-0 border-0 bg-transparent",
              interactive && "cursor-pointer hover:scale-110 transition-transform",
              !interactive && "cursor-default"
            )}
          >
            <Star
              className={cn(
                sizeMap[size],
                filled ? "fill-amber text-amber" : "text-muted-foreground/30"
              )}
            />
          </button>
        );
      })}
      {showCount && count !== undefined && (
        <span className="ml-1 text-xs text-muted-foreground">
          ({count})
        </span>
      )}
      {showCount && rating > 0 && count === undefined && (
        <span className="ml-1 text-xs text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
