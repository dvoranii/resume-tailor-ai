import { API_BASE } from "../types/jobs";

export interface Variant {
  id: number;
  jobId: number | null;
  jobTitle: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
  jobUrl: string | null;
  fitScore: number | null;
}

export async function fetchVariantsForBaseResume(
  baseResumeId: number
): Promise<Variant[]> {
  const response = await fetch(`${API_BASE}/resume/${baseResumeId}/variants`);
  if (!response.ok) throw new Error("Failed to fetch variants");
  return response.json();
}
