import { useState } from "react";
import { setResumeDefault, deleteResume } from "../services/resumes";

export function useResumeActions(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDefault = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await setResumeDefault(id);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default");
    } finally {
      setLoading(false);
    }
  };

  const deleteResumeById = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteResume(id);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete resume");
    } finally {
      setLoading(false);
    }
  };

  return { setDefault, deleteResumeById, loading, error };
}
