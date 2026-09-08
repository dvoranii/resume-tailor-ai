import { useState, useEffect } from "react";
import { API_BASE, type Job, type Collection } from "../types/jobs";
import AddJobForm from "../components/jobs/AddJobForm";
import NewCollectionForm from "../components/jobs/NewCollectionForm";
import CollectionCard from "../components/jobs/CollectionCard";
import { JobCard } from "../components/diff";
import { SearchInput } from "../components/UI";

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]); // ✅ Full unfiltered list
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "manual" | number>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const itemsPerPage = 10;

  // ✅ Fetch all jobs (no filters) – only on mount and after data mutations
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/jobs`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setJobs(data);
    } catch {
      setError("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch(`${API_BASE}/collections`);
      if (!response.ok) throw new Error("Failed to fetch");
      setCollections(await response.json());
    } catch {
      console.error("Failed to load collections");
    }
  };

  // ✅ Only fetch on mount (no filters)
  useEffect(() => {
    fetchJobs();
    fetchCollections();
  }, []); // ✅ Empty dependency array – no re‑fetch on tab/search changes

  // ✅ Reset pagination when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  // ✅ Client‑side filtering: apply tab/collection filter + search
  const visibleJobs = jobs
    .filter((job) => {
      // 1. Filter by active tab (collection or manual)
      if (activeTab === "manual") {
        return job.collectionId === null;
      } else if (activeTab !== "all") {
        return job.collectionId === activeTab;
      }
      return true; // "all" – include everything
    })
    .filter((job) => {
      // 2. Apply search (if any)
      if (!search.trim()) return true;
      const term = search.trim().toLowerCase();
      return (
        job.jobTitle.toLowerCase().includes(term) ||
        job.companyName.toLowerCase().includes(term)
      );
    });

  // ✅ Compute manual jobs from the full list (not filtered)
  const hasManualJobs = jobs.some((j) => j.collectionId === null);

  // Pagination (unchanged)
  const totalPages = Math.ceil(visibleJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedJobs = visibleJobs.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleAdd = (job: Job) => setJobs((prev) => [job, ...prev]);

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_BASE}/jobs/${id}`, { method: "DELETE" });
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch {
      console.error("Failed to delete job");
    }
  };

  const handleCollectionCreated = (c: Collection) =>
    setCollections((prev) => [c, ...prev]);

  const handleScrapeCollection = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/collections/${id}/scrape`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Scrape failed");
      await Promise.all([fetchJobs(), fetchCollections()]);
    } catch {
      console.error("Failed to scrape collection");
    }
  };

  const handleDeleteCollection = async (id: number) => {
    try {
      setJobs((prev) => prev.filter((job) => job.collectionId !== id));
      setCollections((prev) => prev.filter((c) => c.id !== id));

      const response = await fetch(`${API_BASE}/collections/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete collection");
      }

      if (activeTab === id) {
        setActiveTab("all");
      }

      await fetchJobs(); // refresh from backend
    } catch (error) {
      console.error("Failed to delete collection:", error);
      await Promise.all([fetchJobs(), fetchCollections()]);
    }
  };

  // ✅ Search handler
  const handleSearch = (term: string) => {
    setSearch(term);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header with job count and search */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-primary font-semibold text-lg">Jobs</h1>
          <p className="text-text-muted text-sm">
            Manage your job list. Jobs added here are available for AI
            tailoring.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-text-muted bg-bg-surface border border-border px-2 py-1 rounded-md">
            {visibleJobs.length} {visibleJobs.length === 1 ? "job" : "jobs"}
          </span>
          <SearchInput
            placeholder="Search by job title or company..."
            onSearch={handleSearch}
            debounceMs={300}
          />
        </div>
      </div>

      <NewCollectionForm onCreated={handleCollectionCreated} />
      <AddJobForm onAdd={handleAdd} />

      {/* Tabs + Collections */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-text-muted">Collections</span>
        <div className="flex items-start gap-3">
          {/* Static tabs – stacked vertically */}
          <div className="flex flex-col gap-1 min-w-[120px]">
            <button
              onClick={() => setActiveTab("all")}
              className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                activeTab === "all"
                  ? "border-accent bg-bg-input text-text-primary"
                  : "border-border bg-bg-surface text-text-muted hover:bg-bg-input"
              }`}
            >
              All Jobs
            </button>
            {/* ✅ Always show Manual Jobs if there are any manual jobs globally */}
            {hasManualJobs && (
              <button
                onClick={() => setActiveTab("manual")}
                className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                  activeTab === "manual"
                    ? "border-accent bg-bg-input text-text-primary"
                    : "border-border bg-bg-surface text-text-muted hover:bg-bg-input"
                }`}
              >
                Manual Jobs
              </button>
            )}
          </div>

          {/* Collections – horizontally scrollable */}
          <div className="flex-1 overflow-x-auto flex items-center gap-2 pb-1">
            {collections.map((c) => (
              <CollectionCard
                key={c.id}
                collection={c}
                active={activeTab === c.id}
                onSelect={() => setActiveTab(c.id)}
                onScrape={() => handleScrapeCollection(c.id)}
                onDelete={() => handleDeleteCollection(c.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {loading && <p className="text-text-muted text-sm">Loading jobs...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && visibleJobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg">
          <p className="text-text-muted text-sm">
            {activeTab === "all"
              ? search.trim()
                ? "No jobs match your search."
                : "No jobs added yet."
              : activeTab === "manual"
              ? "No manual jobs added."
              : "No jobs in this collection yet."}
          </p>
          <p className="text-text-muted text-xs mt-1">
            {activeTab === "all"
              ? "Use the form above to add your first job, or create a collection to auto-scrape."
              : activeTab === "manual"
              ? "Add a job manually using the form above."
              : "Click Re-scrape above to fetch jobs."}
          </p>
        </div>
      )}

      {paginatedJobs.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {paginatedJobs.map((job) => (
              <JobCard key={job.id} job={job} onDelete={handleDelete} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-border rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-input transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-text-muted">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-border rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-bg-input transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
