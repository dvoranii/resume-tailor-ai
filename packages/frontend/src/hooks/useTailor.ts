import { useState } from "react";
import { tailorResume, linkVariantToJob } from "../services/tailor";
import type { TemplateConfig } from "@resumeai/shared";

interface TailorJob {
  id: number;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
}

export function useTailor(
  templateConfig: TemplateConfig,
  onSuccess?: (variantId: number) => void
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const tailor = async (job: TailorJob) => {
    if (!job) return;
    setLoading(true);
    setError(null);
    try {
      const data = await tailorResume({
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        jobDescription: job.jobDescription,
        jobId: job.id,
        templateConfig,
      });

      await linkVariantToJob(job.id, data.variantId);

      setResult(data);
      if (onSuccess) onSuccess(data.variantId);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tailoring failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { tailor, loading, error, result, reset: () => setResult(null) };
}
