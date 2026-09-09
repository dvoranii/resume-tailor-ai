import AddJobForm from "../components/jobs/AddJobForm";
import NewCollectionForm from "../components/jobs/NewCollectionForm";
import CollectionCard from "../components/jobs/CollectionCard";
import { JobCard } from "../components/diff";
import { SearchInput } from "../components/UI";
import { useJobs } from "../hooks/useJobs";
import { useCollections } from "../hooks/useCollections";
import { useCollectionActions } from "../hooks/useCollectionActions";
import { useJobsView } from "../hooks/useJobsView";
import { deleteJob } from "../services/jobs";

export default function Jobs() {
  const {
    jobs,
    loading,
    error,
    refetch: refreshJobs,
    addJob,
    removeJob,
    removeJobsByCollection,
  } = useJobs();

  const {
    collections,
    addCollection,
    removeCollection,
    refresh: refreshCollections,
  } = useCollections();

  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    currentPage,
    totalPages,
    goToPage,
    visibleJobs,
    paginatedJobs,
    hasManualJobs,
  } = useJobsView(jobs);

  const { scrape, remove: removeCollectionAction } = useCollectionActions({
    onScraped: () => {
      refreshJobs();
      refreshCollections();
    },
    onDeleted: (id) => {
      removeJobsByCollection(id);
      removeCollection(id);
      if (activeTab === id) setActiveTab("all");
      refreshJobs();
    },
    onDeleteFailed: () => {
      refreshJobs();
      refreshCollections();
    },
  });

  const handleDelete = async (id: number) => {
    try {
      await deleteJob(id);
      removeJob(id);
    } catch {
      console.error("Failed to delete job");
    }
  };

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
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-text-muted bg-bg-surface border border-border px-2 py-1 rounded-md">
            {visibleJobs.length} {visibleJobs.length === 1 ? "job" : "jobs"}
          </span>
          <SearchInput
            placeholder="Search by job title or company..."
            onSearch={setSearch}
            debounceMs={300}
          />
        </div>
      </div>

      <NewCollectionForm onCreated={addCollection} />
      <AddJobForm onAdd={addJob} />

      <div className="flex flex-col gap-2">
        <span className="text-xs text-text-muted">Collections</span>
        <div className="flex items-start gap-3">
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
          <div className="flex-1 overflow-x-auto flex items-center gap-2 pb-1">
            {collections.map((c) => (
              <CollectionCard
                key={c.id}
                collection={c}
                active={activeTab === c.id}
                onSelect={() => setActiveTab(c.id)}
                onScrape={() => scrape(c.id)}
                onDelete={() => removeCollectionAction(c.id)}
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
