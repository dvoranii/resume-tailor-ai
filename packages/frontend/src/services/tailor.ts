import { API_BASE } from "../types/jobs";
import type { Resume, TemplateConfig } from "@resumeai/shared";

interface TailorPayload {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  jobId: number;
  templateConfig: TemplateConfig;
}

interface TailorResponse {
  variantId: number;
  original: Resume;
  tailored: Resume;
}

export async function tailorResume(
  payload: TailorPayload
): Promise<TailorResponse> {
  const response = await fetch(`${API_BASE}/tailor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Tailoring failed");
  }
  return response.json();
}

export async function linkVariantToJob(
  jobId: number,
  variantId: number
): Promise<void> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/variant`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variantId }),
  });
  if (!response.ok) throw new Error("Failed to link variant to job");
}
