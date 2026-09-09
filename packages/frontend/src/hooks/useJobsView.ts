import { useState, useEffect, useMemo } from "react";
import type { Job } from "../types/jobs";

const ITEMS_PER_PAGE = 10;

export function useJobsView(jobs: Job[]) {
  const [activeTab, setActiveTab] = useState<"all" | "manual" | number>("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  const visibleJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        if (activeTab === "manual") return job.collectionId === null;
        if (activeTab !== "all") return job.collectionId === activeTab;
        return true;
      })
      .filter((job) => {
        if (!search.trim()) return true;
        const term = search.trim().toLowerCase();
        return (
          job.jobTitle.toLowerCase().includes(term) ||
          job.companyName.toLowerCase().includes(term)
        );
      });
  }, [jobs, activeTab, search]);

  const hasManualJobs = useMemo(
    () => jobs.some((j) => j.collectionId === null),
    [jobs]
  );

  const totalPages = Math.ceil(visibleJobs.length / ITEMS_PER_PAGE);

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return visibleJobs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [visibleJobs, currentPage]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return {
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
  };
}
