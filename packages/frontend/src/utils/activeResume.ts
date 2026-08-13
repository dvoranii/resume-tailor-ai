const STORAGE_KEY = "resumeai_active_resume_id";

export function getActiveResumeId(): number | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  const id = parseInt(stored, 10);
  return isNaN(id) ? null : id;
}

export function setActiveResumeId(id: number): void {
  localStorage.setItem(STORAGE_KEY, String(id));
}

export function clearActiveResumeId(): void {
  localStorage.removeItem(STORAGE_KEY);
}
