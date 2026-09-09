import { useState } from "react";
import { scrapeCollection, deleteCollection } from "../services/collections";

interface UseCollectionActionsOptions {
  onScraped?: () => void;
  onDeleted?: (id: number) => void;
  onDeleteFailed?: () => void;
}

export function useCollectionActions({
  onScraped,
  onDeleted,
  onDeleteFailed,
}: UseCollectionActionsOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrape = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await scrapeCollection(id);
      onScraped?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to scrape collection"
      );
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteCollection(id);
      onDeleted?.(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete collection"
      );
      onDeleteFailed?.();
    } finally {
      setLoading(false);
    }
  };

  return { scrape, remove, loading, error };
}
