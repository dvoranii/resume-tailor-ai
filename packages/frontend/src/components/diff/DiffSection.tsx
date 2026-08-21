import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function DiffSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-surface hover:bg-bg-input transition-colors"
      >
        <span className="text-sm font-semibold text-text-primary">{title}</span>
        {expanded ? (
          <ChevronUp size={15} className="text-text-muted" />
        ) : (
          <ChevronDown size={15} className="text-text-muted" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-3 bg-bg-base flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  );
}
