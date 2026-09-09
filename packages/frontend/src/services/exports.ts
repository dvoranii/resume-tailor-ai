import { API_BASE } from "../types/jobs";

export interface ExportRecord {
  id: number;
  resumeId: number | null;
  variantId: number | null;
  jobTitle: string | null;
  companyName: string | null;
  fileName: string;
  created_at: string;
}

export async function fetchExports(): Promise<ExportRecord[]> {
  const response = await fetch(`${API_BASE}/export/exports`);
  if (!response.ok) throw new Error("Failed to fetch exports");
  return response.json();
}

export async function downloadExportById(id: number): Promise<Blob> {
  const response = await fetch(`${API_BASE}/export/exports/${id}/download`);
  if (!response.ok) throw new Error("Failed to download export");
  return response.blob();
}
