import { useState } from "react";
import { Trash2, RefreshCw, X } from "lucide-react";
import type { Collection } from "../../types/jobs";

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleScrape = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setScraping(true);
    try {
      await onScrape();
    } finally {
      setScraping(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = () => {
    setShowConfirmModal(false);
    onDelete();
  };

  return (
    <>
      {/* Collection Card */}
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
            onClick={handleDeleteClick}
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-text-primary font-semibold text-lg">
                Delete Collection?
              </h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-text-muted text-sm mb-2">
              Are you sure you want to delete <strong>{collection.name}</strong>
              ?
            </p>
            <p className="text-text-muted text-sm mb-6">
              This will permanently delete all {collection.jobCount} jobs in
              this collection. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Delete Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
