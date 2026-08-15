import { useState, useEffect } from "react";
import { API_BASE, type Job, type Collection } from "../types/jobs";
import AddJobForm from "../components/jobs/AddJobForm";
import NewCollectionForm from "../components/jobs/NewCollectionForm";
import CollectionCard from "../components/jobs/CollectionCard";
import JobCard from "../components/jobs/JobCard";

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollection, setActiveCollection] = useState<number | "all">(
    "all"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
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

  useEffect(() => {
    fetchJobs();
    fetchCollections();
  }, []);

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

      if (activeCollection === id) {
        setActiveCollection("all");
      }

      await fetchJobs();
    } catch (error) {
      console.error("Failed to delete collection:", error);
      await Promise.all([fetchJobs(), fetchCollections()]);
    }
  };

  const visibleJobs =
    activeCollection === "all"
      ? jobs
      : jobs.filter((j) => j.collectionId === activeCollection);

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-primary font-semibold text-lg">Jobs</h1>
          <p className="text-text-muted text-sm">
            Manage your job list. Jobs added here are available for AI
            tailoring.
          </p>
        </div>
        <span className="text-xs text-text-muted bg-bg-surface border border-border px-2 py-1 rounded-md">
          {visibleJobs.length} {visibleJobs.length === 1 ? "job" : "jobs"}
        </span>
      </div>

      <NewCollectionForm onCreated={handleCollectionCreated} />
      <AddJobForm onAdd={handleAdd} />

      {collections.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-text-muted">Collections</span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCollection("all")}
              className={`shrink-0 border rounded-lg px-3 py-2 text-sm transition-colors ${
                activeCollection === "all"
                  ? "border-accent bg-bg-input text-text-primary"
                  : "border-border bg-bg-surface text-text-muted hover:bg-bg-input"
              }`}
            >
              All Jobs
            </button>
            {collections.map((c) => (
              <CollectionCard
                key={c.id}
                collection={c}
                active={activeCollection === c.id}
                onSelect={() => setActiveCollection(c.id)}
                onScrape={() => handleScrapeCollection(c.id)}
                onDelete={() => handleDeleteCollection(c.id)}
              />
            ))}
          </div>
        </div>
      )}

      {loading && <p className="text-text-muted text-sm">Loading jobs...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && visibleJobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg">
          <p className="text-text-muted text-sm">
            {activeCollection === "all"
              ? "No jobs added yet."
              : "No jobs in this collection yet."}
          </p>
          <p className="text-text-muted text-xs mt-1">
            {activeCollection === "all"
              ? "Use the form above to add your first job, or create a collection to auto-scrape."
              : "Click Re-scrape above to fetch jobs."}
          </p>
        </div>
      )}

      {visibleJobs.length > 0 && (
        <div className="flex flex-col gap-3">
          {visibleJobs.map((job) => (
            <JobCard key={job.id} job={job} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
