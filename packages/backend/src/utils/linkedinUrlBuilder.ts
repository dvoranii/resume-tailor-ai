interface LinkedInFilters {
  timeRange?: "24h" | "7d" | "30d" | "";
  remoteOnly?: boolean;
  minSalary?: number;
  experienceLevel?: string; // '1'=internship, '2'=entry, '3'=associate, '4'=senior, '5'=director
  sortBy?: "recent" | "relevant";
}

export function buildLinkedInUrl(
  keywords: string,
  location: string,
  filters?: LinkedInFilters
): string {
  const base = "https://www.linkedin.com/jobs/search/";
  const params = new URLSearchParams();

  // Required parameters
  if (keywords) params.set("keywords", keywords);
  if (location) params.set("location", location);

  // Time range filters
  if (filters?.timeRange === "24h") params.set("f_TPR", "r86400");
  else if (filters?.timeRange === "7d") params.set("f_TPR", "r604800");
  else if (filters?.timeRange === "30d") params.set("f_TPR", "r2592000");

  // Remote only (f_WT=2 means remote)
  if (filters?.remoteOnly) params.set("f_WT", "2");

  // Salary filter (f_SB2 parameter)
  if (filters?.minSalary) {
    params.set("f_SB2", `salary_${filters.minSalary}`);
  }

  // Experience level
  if (filters?.experienceLevel) {
    params.set("f_E", filters.experienceLevel);
  }

  // Sort by (DD = date descending, i.e., newest first)
  if (filters?.sortBy === "recent") {
    params.set("sortBy", "DD");
  }

  return base + "?" + params.toString();
}

// Helper to validate if a URL is a valid LinkedIn search URL
export function isValidLinkedInSearchUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const isLinkedIn = parsed.hostname.includes("linkedin.com");
    const isJobsPath = parsed.pathname.includes("/jobs/search");
    const hasKeywords = parsed.searchParams.has("keywords");
    return isLinkedIn && isJobsPath && hasKeywords;
  } catch {
    return false;
  }
}
