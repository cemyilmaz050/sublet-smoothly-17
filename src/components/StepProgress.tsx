import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface StepProgressProps {
  steps: string[];
  currentStep: number;
}

const SHORT_LABELS = ["Property Basics", "Photos", "Pricing", "House Rules", "Submit"];

const StepProgress = ({ steps, currentStep }: StepProgressProps) => {
  const isMobile = useIsMobile();
  const labels = steps.length === SHORT_LABELS.length ? SHORT_LABELS : steps;

  if (isMobile) {
    const pct = ((currentStep) / (steps.length - 1)) * 100;
    return (
      <div className="w-full px-4 py-3">
        <p className="text-center text-sm font-semibold text-foreground">
          Step {currentStep + 1} of {steps.length}: {labels[currentStep]}
        </p>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-8">
      <div className="flex items-start justify-between">
        {labels.map((label, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={index} className="relative flex flex-1 flex-col items-center">
              {/* Connecting line — drawn from this circle to the next */}
              {index < labels.length - 1 && (
                <div
                  className={cn(
                    "absolute top-[18px] h-[2px] md:top-[22px]",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                  style={{
                    left: "calc(50% + 18px)",
                    right: "calc(-50% + 18px)",
                  }}
                />
              )}

              {/* Circle */}
              <div
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold md:h-11 md:w-11 md:text-sm",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4 md:h-5 md:w-5" /> : index + 1}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "mt-2 whitespace-nowrap text-center text-[11px] md:text-[13px]",
                  isActive
                    ? "font-bold text-foreground"
                    : isCompleted
                    ? "font-medium text-foreground"
                    : "font-medium text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgress;
