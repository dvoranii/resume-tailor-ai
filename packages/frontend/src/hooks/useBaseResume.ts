import { useState, useEffect } from "react";
import { fetchResumeById } from "../services/resumes";

export function useBaseResume(id: number) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const data = await fetchResumeById(id);
        setName(data.name || "Untitled");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load resume");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  return { name, loading, error };
}
