const STORAGE_KEY_BASE = "resumeai_active_resume_id";
const STORAGE_KEY_VARIANT = "resumeai_active_variant_id";

// base
export function getActiveResumeId(): number | null {
  const stored = localStorage.getItem(STORAGE_KEY_BASE);
  if (!stored) return null;
  const id = parseInt(stored, 10);
  return isNaN(id) ? null : id;
}

export function setActiveResumeId(id: number): void {
  localStorage.setItem(STORAGE_KEY_BASE, String(id));
}

export function clearActiveResumeId(): void {
  localStorage.removeItem(STORAGE_KEY_BASE);
}

// variants
export function getActiveVariantId(): number | null {
  const stored = localStorage.getItem(STORAGE_KEY_VARIANT);
  if (!stored) return null;
  const id = parseInt(stored, 10);
  return isNaN(id) ? null : id;
}

export function setActiveVariantId(id: number): void {
  localStorage.setItem(STORAGE_KEY_VARIANT, String(id));
}

export function clearActiveVariantId(): void {
  localStorage.removeItem(STORAGE_KEY_VARIANT);
}

export function clearActiveState(): void {
  clearActiveResumeId();
  clearActiveVariantId();
}
