import { useState, useEffect } from "react";
import { fetchAllCollections } from "../services/collections";
import type { Collection } from "../types/jobs";

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllCollections();
      setCollections(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch collections"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const addCollection = (c: Collection) =>
    setCollections((prev) => [c, ...prev]);

  const removeCollection = (id: number) =>
    setCollections((prev) => prev.filter((c) => c.id !== id));

  return {
    collections,
    loading,
    error,
    refresh,
    addCollection,
    removeCollection,
  };
}
