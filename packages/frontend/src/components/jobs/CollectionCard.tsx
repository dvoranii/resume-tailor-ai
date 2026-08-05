import { useState } from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { type Collection } from "../../types/jobs";

export default function CollectionCard({
  collection,
  active,
  onSelect,
  onScrape,
  onDelete,
}: {
  collection: Collection;
  active: boolean;
  onSelect: () => void;
  onScrape: () => Promise<void>;
  onDelete: () => void;
}) {
  const [scraping, setScraping] = useState(false);

  const handleScrape = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setScraping(true);
    try {
      await onScrape();
    } finally {
      setScraping(false);
    }
  };

  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-start gap-1 border rounded-lg px-3 py-2 min-w-[170px] text-left transition-colors ${
        active
          ? "border-accent bg-bg-input"
          : "border-border bg-bg-surface hover:bg-bg-input"
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-sm font-medium text-text-primary truncate">
          {collection.name}
        </span>
        <Trash2
          size={13}
          className="text-text-muted hover:text-red-400 transition-colors shrink-0 ml-2"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
      </div>
      <span className="text-xs text-text-muted">
        {collection.jobCount} {collection.jobCount === 1 ? "job" : "jobs"}
      </span>
      <span
        onClick={handleScrape}
        className="text-xs text-accent hover:underline flex items-center gap-1"
      >
        <RefreshCw size={11} className={scraping ? "animate-spin" : ""} />
        {scraping ? "Scraping..." : "Re-scrape"}
      </span>
    </button>
  );
}
