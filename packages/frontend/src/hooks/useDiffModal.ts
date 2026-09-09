import { useState } from "react";
import type { Resume } from "@resumeai/shared";
import { API_BASE } from "../types/jobs";

interface DiffData {
  original: Resume;
  tailored: Resume;
}

export function useDiffModal() {
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  const openDiffModal = async (variantId: number) => {
    if (!variantId) return;
    setLoadingDiff(true);
    try {
      const variantRes = await fetch(
        `${API_BASE}/resume/variants/${variantId}`
      );
      if (!variantRes.ok) throw new Error("Failed to fetch variant");
      const variantData = await variantRes.json();
      const baseResumeId = variantData.resumeId;
      if (!baseResumeId) {
        alert("Could not find base resume for this variant.");
        return;
      }
      const originalRes = await fetch(`${API_BASE}/resume?id=${baseResumeId}`);
      if (!originalRes.ok) throw new Error("Failed to fetch base resume");
      const originalData = await originalRes.json();
      setDiffData({
        original: originalData,
        tailored: variantData.tailoredData,
      });
      setShowDiffModal(true);
    } catch (error) {
      console.error("Failed to load diff:", error);
      alert("Failed to load changes.");
    } finally {
      setLoadingDiff(false);
    }
  };

  const closeDiffModal = () => {
    setShowDiffModal(false);
    setDiffData(null);
  };

  return {
    showDiffModal,
    diffData,
    loadingDiff,
    openDiffModal,
    closeDiffModal,
  };
}
