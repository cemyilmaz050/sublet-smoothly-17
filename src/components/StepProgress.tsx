import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface StepProgressProps {
  steps: string[];
  currentStep: number;
}

const StepProgress = ({ steps, currentStep }: StepProgressProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {currentStep + 1}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{steps[currentStep]}</p>
            <p className="text-xs text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
                i < currentStep ? "bg-primary" : i === currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-1 items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all",
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < currentStep ? <Check className="h-5 w-5" /> : index + 1}
              </div>
              <span
                className={cn(
                  "max-w-[100px] text-center text-[11px] leading-tight md:text-xs",
                  index === currentStep
                    ? "font-bold text-foreground"
                    : index < currentStep
                    ? "font-medium text-foreground"
                    : "font-medium text-muted-foreground"
                )}
              >
                {step}
              </span>
            </div>
            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mt-[-1.5rem] h-0.5 flex-1",
                  index < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepProgress;
