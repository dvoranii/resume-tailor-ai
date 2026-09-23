import { API_BASE, type Job } from "../types/jobs";
import type { CreateJobPayload } from "../types/jobs";

export async function fetchJobsForResume(resumeId?: number): Promise<Job[]> {
  const url = resumeId
    ? `${API_BASE}/jobs?baseResumeId=${resumeId}`
    : `${API_BASE}/jobs`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch jobs");
  return response.json();
}

export async function deleteJob(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/jobs/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete job");
}

export async function createJob(
  payload: CreateJobPayload
): Promise<{ id: number }> {
  const response = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to add job");
  }
  return response.json();
}
