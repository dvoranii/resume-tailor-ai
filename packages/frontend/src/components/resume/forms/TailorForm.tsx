import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Eye } from "lucide-react";
import { useResumeBuilder } from "../../../context/ResumeBuilderContext";
import { useJobs } from "../../../hooks/useJobs";
import { useTailor } from "../../../hooks/useTailor";
import { useDiffModal } from "../../../hooks/useDiffModal";
import DiffModal from "../../diff/DiffModal";

export default function TailorForm({ resumeId }: { resumeId?: number }) {
  const navigate = useNavigate();
  const { templateConfig } = useResumeBuilder();

  const { jobs, loading: jobsLoading } = useJobs(resumeId);
  const { tailor, loading, error, reset } = useTailor(
    templateConfig,
    (variantId) => {
      navigate(
        `/resume?variantId=${variantId}&baseResumeId=${resumeId}&showDiff=true`
      );
    }
  );

  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;

  const {
    showDiffModal,
    diffData,
    loadingDiff,
    openDiffModal,
    closeDiffModal,
  } = useDiffModal();

  const handleJobSelect = (id: number) => {
    setSelectedJobId(id);
    const job = jobs.find((j) => j.id === id);
    if (job?.jobDescription) setJobDescription(job.jobDescription);
    reset();
    setLocalError(null);
  };

  const handleTailor = async () => {
    if (!selectedJob) return;
    try {
      await tailor(selectedJob);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Tailoring failed");
    }
  };

  const handleViewChanges = () => {
    if (selectedJob?.variantId) openDiffModal(selectedJob.variantId);
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
          className="bg-bg-base border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
          disabled={jobsLoading}
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
              className="bg-bg-base border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          {selectedJob.status === "tailored" && selectedJob.variantId && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleViewChanges}
                disabled={loadingDiff}
                className="flex items-center gap-1.5 text-accent hover:underline text-sm px-3 py-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Eye size={15} />
                {loadingDiff ? "Loading..." : "View Changes"}
              </button>
              <span className="text-xs text-text-muted/70">
                This job already has a tailored resume.
              </span>
            </div>
          )}

          {selectedJob.status === "tailored" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-950/30 border border-blue-800 rounded-md">
              <span className="text-blue-300 text-xs">
                Tailoring again will create a new variant.
              </span>
            </div>
          )}

          {(error || localError) && (
            <p className="text-red-400 text-sm">{error || localError}</p>
          )}

          <button
            onClick={handleTailor}
            disabled={loading || !jobDescription.trim() || jobsLoading}
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm px-4 py-2.5 rounded-md transition-colors w-fit"
          >
            <Sparkles size={15} />
            {loading ? "Tailoring..." : "Tailor Resume"}
          </button>
        </>
      )}

      {jobs.length === 0 && !jobsLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg">
          <p className="text-text-muted text-sm">No jobs added yet.</p>
          <p className="text-text-muted text-xs mt-1">
            Add jobs from the Jobs tab first.
          </p>
        </div>
      )}

      {showDiffModal && diffData && selectedJob && (
        <DiffModal
          original={diffData.original}
          tailored={diffData.tailored}
          jobTitle={selectedJob.jobTitle}
          companyName={selectedJob.companyName}
          onClose={closeDiffModal}
        />
      )}
    </div>
  );
}
