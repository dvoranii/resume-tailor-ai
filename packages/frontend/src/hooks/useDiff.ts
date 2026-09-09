import { useState } from "react";
import { fetchVariantById, fetchBaseResumeById } from "../services/resumes";
import type { Resume } from "@resumeai/shared";

interface DiffData {
  original: Resume;
  tailored: Resume;
}

export function useDiff() {
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDiff = async (variantId: number) => {
    setLoading(true);
    setError(null);
    try {
      const variantData = await fetchVariantById(variantId);
      const baseResumeId = variantData.resumeId;
      if (!baseResumeId) {
        throw new Error("Could not find base resume for this variant.");
      }
      const originalData = await fetchBaseResumeById(baseResumeId);
      setDiffData({
        original: originalData,
        tailored: variantData.tailoredData,
      });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load changes.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const clearDiff = () => setDiffData(null);

  return { diffData, loading, error, loadDiff, clearDiff };
}
