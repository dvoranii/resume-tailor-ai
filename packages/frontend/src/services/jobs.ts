import { API_BASE, type Job } from "../types/jobs";

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
