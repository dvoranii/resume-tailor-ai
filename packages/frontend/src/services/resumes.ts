import type { Resume, TemplateConfig } from "@resumeai/shared";
import { API_BASE } from "../types/jobs";
import type {
  Variant,
  BaseResume,
  RawResume,
  SaveResumePayload,
  ExportPayload,
} from "../types/resumes";

export function convertToBaseResume(raw: RawResume): BaseResume {
  return {
    ...raw,
    isDefault: raw.isDefault === 1,
    isComplete: raw.isComplete === 1,
  };
}

export async function fetchBaseResumes(): Promise<BaseResume[]> {
  const response = await fetch(`${API_BASE}/resume/list`);
  if (!response.ok) throw new Error("Failed to fetch resumes");
  const rawData: RawResume[] = await response.json();
  return rawData.map(convertToBaseResume);
}

export async function setResumeDefault(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/resume/${id}/default`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isDefault: true }),
  });
  if (!response.ok) throw new Error("Failed to set default");
}

export async function deleteResume(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/resume/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete resume");
}

export async function fetchResumeById(
  id: number
): Promise<{ id: number; name: string }> {
  const response = await fetch(`${API_BASE}/resume?id=${id}`);
  if (!response.ok) throw new Error("Failed to fetch resume");
  return response.json();
}

export async function fetchVariantById(variantId: number): Promise<Variant> {
  const response = await fetch(`${API_BASE}/resume/variants/${variantId}`);
  if (!response.ok) throw new Error("Failed to fetch variant");
  return response.json();
}

export async function fetchBaseResumeById(id: number): Promise<Resume> {
  const response = await fetch(`${API_BASE}/resume?id=${id}`);
  if (!response.ok) throw new Error("Failed to fetch base resume");
  return response.json();
}

// CONTEXT

export async function fetchResume(id?: number | null): Promise<Resume | null> {
  const url = id ? `${API_BASE}/resume?id=${id}` : `${API_BASE}/resume`;
  const response = await fetch(url);
  if (response.status === 404) return null;
  if (!response.ok)
    throw new Error(`Failed to fetch resume: ${response.status}`);
  return response.json();
}

export async function fetchResumeList(): Promise<RawResume[]> {
  const response = await fetch(`${API_BASE}/resume/list`);
  if (!response.ok) throw new Error("Failed to fetch resume list");
  return response.json();
}

export async function saveResumeApi(payload: SaveResumePayload): Promise<void> {
  const response = await fetch(`${API_BASE}/resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok)
    throw new Error(`Failed to save resume: ${response.status}`);
}

export async function saveVariantApi(
  variantId: number,
  data: Resume,
  templateConfig: TemplateConfig
): Promise<void> {
  const response = await fetch(`${API_BASE}/resume/variants/${variantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tailoredData: data, templateConfig }),
  });
  if (!response.ok) throw new Error("Failed to save variant");
}

export async function saveTemplateConfig(
  target: { type: "variant"; id: number } | { type: "resume"; id: number },
  config: TemplateConfig
): Promise<void> {
  const url =
    target.type === "variant"
      ? `${API_BASE}/resume/variants/${target.id}/template`
      : `${API_BASE}/resume/${target.id}/template`;
  await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateConfig: config }),
  });
}

export async function exportResumePdf(payload: ExportPayload): Promise<Blob> {
  const response = await fetch(`${API_BASE}/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Export failed");
  }
  return response.blob();
}
