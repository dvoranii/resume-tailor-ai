import { useState, useEffect } from "react";
import { fetchBaseResumes } from "../services/resumes";
import type { BaseResume } from "../types/resumes";

export function useBaseResumes() {
  const [resumes, setResumes] = useState<BaseResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBaseResumes();
      setResumes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch resumes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { resumes, loading, error, refresh };
}
