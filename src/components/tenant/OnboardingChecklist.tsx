import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface Props {
  identityVerified: boolean;
  documentsSubmitted: boolean;
  hasListing: boolean;
  onSublet: () => void;
}

const OnboardingChecklist = ({ identityVerified, documentsSubmitted, hasListing, onSublet }: Props) => {
  const navigate = useNavigate();

  const steps = [
    { label: "Create your account", done: true },
    { label: "Verify your identity", done: identityVerified, cta: "Complete", action: () => navigate("/subtenant/onboarding") },
    { label: "Submit your documents", done: documentsSubmitted, cta: "Upload Documents", action: () => navigate("/tenant/documents") },
    { label: "Post your first listing", done: hasListing, cta: "Sublet Your Apartment", action: onSublet },
  ];

  return (
    <div className="flex justify-center py-8">
      <Card className="w-full max-w-lg shadow-elevated">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-foreground mb-1">Get started with SubletSafe</h2>
          <p className="text-sm text-muted-foreground mb-8">Complete these steps to list your property</p>

          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  step.done ? "bg-emerald text-emerald-foreground" : "border-2 border-border"
                }`}>
                  {step.done ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold text-muted-foreground">{i + 1}</span>}
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <p className={`text-sm font-medium ${step.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {step.label}
                  </p>
                  {!step.done && step.cta && (
                    <Button size="sm" variant={i === steps.length - 1 ? "default" : "outline"} onClick={step.action}>
                      {step.cta}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingChecklist;
