import { useState, useEffect } from "react";
import { fetchJobsForResume } from "../services/jobs";
import type { Job } from "../types/jobs";

export function useJobs(resumeId?: number) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJobsForResume(resumeId);
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [resumeId]);

  const addJob = (job: Job) => setJobs((prev) => [job, ...prev]);
  const removeJob = (id: number) =>
    setJobs((prev) => prev.filter((j) => j.id !== id));
  const removeJobsByCollection = (collectionId: number) =>
    setJobs((prev) => prev.filter((job) => job.collectionId !== collectionId));

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
    addJob,
    removeJob,
    removeJobsByCollection,
  };
}
