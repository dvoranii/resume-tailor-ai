import { useState, useEffect } from "react";
import { fetchExports, type ExportRecord } from "../services/exports";

export function useExports() {
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExports();
      setExports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch exports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { exports, loading, error, refresh };
}
