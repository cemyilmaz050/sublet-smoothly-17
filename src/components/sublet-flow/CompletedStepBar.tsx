import { Check, Pencil } from "lucide-react";

interface CompletedStepBarProps {
  label: string;
  summary: string;
  onEdit: () => void;
}

const CompletedStepBar = ({ label, summary, onEdit }: CompletedStepBarProps) => (
  <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-card">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
      <Check className="h-4 w-4 text-primary-foreground" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="truncate text-sm font-semibold text-foreground">{summary}</p>
    </div>
    <button
      onClick={onEdit}
      className="flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0 min-h-[44px] min-w-[44px] justify-center"
    >
      <Pencil className="h-3 w-3" /> Edit
    </button>
  </div>
);

export default CompletedStepBar;
