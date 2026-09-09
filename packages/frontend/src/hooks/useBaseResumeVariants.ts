import { useState, useEffect } from "react";
import { fetchVariantsForBaseResume, type Variant } from "../services/variants";

export function useBaseResumeVariants(baseResumeId: number) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!baseResumeId) return;
    const fetchData = async () => {
      try {
        const data = await fetchVariantsForBaseResume(baseResumeId);
        setVariants(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load variants"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [baseResumeId]);

  return { variants, loading, error };
}
