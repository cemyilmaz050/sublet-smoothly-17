import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const PLATFORM_FEE_PERCENT = 6;

interface PlatformFeeTooltipProps {
  amount?: number;
}

const PlatformFeeTooltip = ({ amount }: PlatformFeeTooltipProps) => {
  const feeAmount = amount ? (amount * PLATFORM_FEE_PERCENT / 100).toFixed(2) : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          {PLATFORM_FEE_PERCENT}% platform fee
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-sm">
        <p>
          A {PLATFORM_FEE_PERCENT}% platform fee is applied to each transaction to cover secure payments, document management, and platform support.
          {feeAmount && ` Fee on this amount: $${feeAmount}`}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

export { PLATFORM_FEE_PERCENT };
export default PlatformFeeTooltip;
