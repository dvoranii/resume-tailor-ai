import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { API_BASE } from "../../../types/jobs";

interface Job {
  id: number;
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  jobDescription: string;
  status: "new" | "tailored" | "applied";
  variantId: number | null;
}

export default function TailorForm({ resumeId }: { resumeId?: number }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch jobs only if resumeId is provided
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const url = resumeId
          ? `${API_BASE}/jobs?baseResumeId=${resumeId}`
          : `${API_BASE}/jobs`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        }
      } catch {
        console.error("Failed to fetch jobs");
      }
    };
    fetchJobs();
  }, [resumeId]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;

  const handleJobSelect = (id: number) => {
    setSelectedJobId(id);
    const job = jobs.find((j) => j.id === id);
    if (job?.jobDescription) setJobDescription(job.jobDescription);
    setError(null);
  };

  const handleTailor = async () => {
    if (!selectedJob || !jobDescription.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/tailor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: selectedJob.jobTitle,
          companyName: selectedJob.companyName,
          jobDescription,
          jobId: selectedJob.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Tailoring failed");
        return;
      }

      await fetch(`${API_BASE}/jobs/${selectedJob.id}/variant`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: data.variantId }),
      });

      setJobs((prev) =>
        prev.map((j) =>
          j.id === selectedJob.id
            ? { ...j, status: "tailored", variantId: data.variantId }
            : j
        )
      );

      navigate(
        `/resume?variantId=${data.variantId}&baseResumeId=${resumeId}&showDiff=true`
      );
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (!resumeId) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-text-primary font-semibold text-base">
            Tailor Resume
          </h2>
          <p className="text-text-muted text-sm">
            Please select a base resume from the Dashboard to start tailoring.
          </p>
        </div>
      </div>
    );
  }

  const untailoredJobs = jobs.filter((j) => j.status === "new");
  const tailoredJobs = jobs.filter((j) => j.status !== "new");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-text-primary font-semibold text-base">
          Tailor Resume
        </h2>
        <p className="text-text-muted text-sm">
          Select a job from your list, review the description, and let AI tailor
          your resume to match.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-text-muted">Select Job</label>
        <select
          value={selectedJobId ?? ""}
          onChange={(e) => handleJobSelect(Number(e.target.value))}
          className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
        >
          <option value="" disabled>
            Choose a job to tailor for...
          </option>
          {untailoredJobs.length > 0 && (
            <optgroup label="New">
              {untailoredJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.jobTitle} — {job.companyName}
                </option>
              ))}
            </optgroup>
          )}
          {tailoredJobs.length > 0 && (
            <optgroup label="Already Tailored">
              {tailoredJobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.jobTitle} — {job.companyName} ({job.status})
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {selectedJob && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted">Job Description</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste or edit the job description here..."
              rows={12}
              className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          {selectedJob.status === "tailored" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-950/30 border border-blue-800 rounded-md">
              <span className="text-blue-300 text-xs">
                This job already has a tailored resume. Tailoring again will
                create a new variant.
              </span>
            </div>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleTailor}
            disabled={loading || !jobDescription.trim()}
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm px-4 py-2.5 rounded-md transition-colors w-fit"
          >
            <Sparkles size={15} />
            {loading ? "Tailoring..." : "Tailor Resume"}
          </button>
        </>
      )}

      {jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg">
          <p className="text-text-muted text-sm">No jobs added yet.</p>
          <p className="text-text-muted text-xs mt-1">
            Add jobs from the Jobs tab first.
          </p>
        </div>
      )}
    </div>
  );
}
