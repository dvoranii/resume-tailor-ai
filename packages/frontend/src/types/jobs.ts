export interface Job {
  id: number;
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  jobDescription: string;
  fitScore: number | null;
  seniorityLevel: string | null;
  salary: string | null;
  suggestedFocus: string | null;
  reasoning: string | null;
  status: "new" | "tailored" | "applied";
  variantId: number | null;
  collectionId: number | null;
}

export interface Collection {
  id: number;
  name: string;
  searchQuery: string;
  location: string | null;
  jobCount: number;
  lastScrapedAt: string | null;
  totalJobsFound: number;
}

export const statusColors: Record<Job["status"], string> = {
  new: "bg-bg-input text-text-muted",
  tailored: "bg-blue-950/40 text-blue-300 border border-blue-800",
  applied: "bg-green-950/40 text-green-300 border border-green-800",
};

export const API_BASE = "http://localhost:3001/api/v1";
