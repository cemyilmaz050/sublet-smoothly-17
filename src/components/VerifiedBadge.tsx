import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  verified: boolean;
  size?: "sm" | "md";
}

const VerifiedBadge = ({ verified, size = "sm" }: VerifiedBadgeProps) => {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  if (!verified) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="gap-1 text-xs border-emerald/30 text-emerald cursor-help">
          <ShieldCheck className={iconSize} /> Verified
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">This host's identity has been verified with a government-issued ID</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default VerifiedBadge;
