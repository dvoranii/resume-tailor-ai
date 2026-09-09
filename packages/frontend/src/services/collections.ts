import { API_BASE, type Collection } from "../types/jobs";

interface CreateCollectionPayload {
  name: string;
  searchQuery: string;
  location?: string | null;
  maxItems: number;
  baseResumeId: number;
}

export async function fetchAllCollections(): Promise<Collection[]> {
  const response = await fetch(`${API_BASE}/collections`);
  if (!response.ok) throw new Error("Failed to fetch collections");
  return response.json();
}

export async function scrapeCollection(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/collections/${id}/scrape`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Scrape failed");
}

export async function deleteCollection(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/collections/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete collection");
}

export async function createCollection(
  payload: CreateCollectionPayload
): Promise<{ id: number }> {
  const response = await fetch(`${API_BASE}/collections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create collection");
  }
  return response.json();
}
