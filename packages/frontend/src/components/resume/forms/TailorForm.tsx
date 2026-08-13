import { useState, useEffect } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import type { Resume } from "@resumeai/shared";
import { API_BASE } from "../../../types/jobs";

// const API_BASE = "http://localhost:3001/api/v1";

interface Job {
  id: number;
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  jobDescription: string;
  status: "new" | "tailored" | "applied";
  variantId: number | null;
}

interface TailorResult {
  variantId: number;
  original: Resume;
  tailored: Resume;
}

function DiffBullets({
  original,
  tailored,
}: {
  original: string[];
  tailored: string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ul className="flex flex-col gap-1">
        {original.map((b, i) => (
          <li
            key={i}
            className={`text-xs leading-relaxed px-2 py-1 rounded ${
              b !== tailored[i]
                ? "bg-red-950/40 text-red-300"
                : "text-text-muted"
            }`}
          >
            {b || <span className="opacity-40 italic">empty</span>}
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-1">
        {tailored.map((b, i) => (
          <li
            key={i}
            className={`text-xs leading-relaxed px-2 py-1 rounded ${
              b !== original[i]
                ? "bg-green-950/40 text-green-300"
                : "text-text-muted"
            }`}
          >
            {b || <span className="opacity-40 italic">empty</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DiffSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-surface hover:bg-bg-input transition-colors"
      >
        <span className="text-sm font-semibold text-text-primary">{title}</span>
        {expanded ? (
          <ChevronUp size={15} className="text-text-muted" />
        ) : (
          <ChevronDown size={15} className="text-text-muted" />
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-3 bg-bg-base flex flex-col gap-3">
          {children}
        </div>
      )}
    </div>
  );
}

function DiffColumnHeaders() {
  return (
    <div className="grid grid-cols-2 gap-4 mb-1">
      <span className="text-xs font-semibold text-text-muted uppercase tracking-wide">
        Original
      </span>
      <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">
        Tailored
      </span>
    </div>
  );
}

interface DiffReviewProps {
  result: TailorResult;
  job: Job;
  onExport: (variantId: number) => void;
  onDiscard: () => void;
  exporting: boolean;
}

function DiffReview({
  result,
  job,
  onExport,
  onDiscard,
  exporting,
}: DiffReviewProps) {
  const { original, tailored, variantId } = result;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-text-primary font-semibold text-sm">
            Review Changes
          </h3>
          <p className="text-text-muted text-xs">
            {job.jobTitle} at {job.companyName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDiscard}
            className="text-sm text-text-muted hover:text-text-primary transition-colors px-3 py-1.5"
          >
            Discard
          </button>
          <button
            onClick={() => onExport(variantId)}
            disabled={exporting}
            className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-md transition-colors"
          >
            {exporting ? "Exporting..." : "Export PDF"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {original.summary !== tailored.summary && (
          <DiffSection title="Summary">
            <DiffColumnHeaders />
            <div className="grid grid-cols-2 gap-4">
              <p className="text-xs leading-relaxed text-red-300 bg-red-950/40 px-2 py-1 rounded">
                {original.summary}
              </p>
              <p className="text-xs leading-relaxed text-green-300 bg-green-950/40 px-2 py-1 rounded">
                {tailored.summary}
              </p>
            </div>
          </DiffSection>
        )}

        {tailored.experience.map((company, ci) => {
          const origCompany = original.experience[ci];
          return company.roles.map((role, ri) => {
            const origRole = origCompany?.roles[ri];
            const bulletsChanged = role.bullets.some(
              (b, bi) => b.content !== origRole?.bullets[bi]?.content
            );
            if (!bulletsChanged) return null;
            return (
              <DiffSection
                key={`${ci}-${ri}`}
                title={`${company.companyName} — ${role.title}`}
              >
                <DiffColumnHeaders />
                <DiffBullets
                  original={
                    (origRole?.bullets.map((b) => b.content) as string[]) ?? []
                  }
                  tailored={role.bullets.map((b) => b.content) as string[]}
                />
              </DiffSection>
            );
          });
        })}

        {tailored.projects.map((project, pi) => {
          const origProject = original.projects[pi];
          const bulletsChanged = project.bullets.some(
            (b, bi) => b.content !== origProject?.bullets[bi]?.content
          );
          if (!bulletsChanged) return null;
          return (
            <DiffSection key={pi} title={`Project — ${project.name}`}>
              <DiffColumnHeaders />
              <DiffBullets
                original={origProject?.bullets.map((b) => b.content) ?? []}
                tailored={project.bullets.map((b) => b.content)}
              />
            </DiffSection>
          );
        })}

        {tailored.skills.map((cat, si) => {
          const origCat = original.skills[si];
          const changed = cat.items.join(",") !== origCat?.items.join(",");
          if (!changed) return null;
          return (
            <DiffSection key={si} title={`Skills — ${cat.category}`}>
              <DiffColumnHeaders />
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-wrap gap-1.5">
                  {origCat?.items.map((item, i) => (
                    <span
                      key={i}
                      className="text-xs bg-bg-input border border-border rounded px-2 py-0.5 text-text-muted"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((item, i) => (
                    <span
                      key={i}
                      className="text-xs bg-green-950/40 border border-green-800 rounded px-2 py-0.5 text-green-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </DiffSection>
          );
        })}
      </div>
    </div>
  );
}

export default function TailorForm() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TailorResult | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${API_BASE}/jobs`);
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        }
      } catch {
        console.error("Failed to fetch jobs");
      }
    };
    fetchJobs();
  }, []);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? null;

  const handleJobSelect = (id: number) => {
    setSelectedJobId(id);
    const job = jobs.find((j) => j.id === id);
    if (job?.jobDescription) setJobDescription(job.jobDescription);
    setResult(null);
    setError(null);
  };

  const handleTailor = async () => {
    if (!selectedJob || !jobDescription.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

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
      setResult(data);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (variantId: number) => {
    setExporting(true);
    try {
      const response = await fetch(
        `${API_BASE}/export/pdf/variant/${variantId}`,
        { method: "POST" }
      );
      if (!response.ok) {
        const err = await response.json();
        setError(err.error || "Export failed");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename =
        [selectedJob?.companyName, selectedJob?.jobTitle]
          .filter(Boolean)
          .join("_")
          .replace(/\s+/g, "_") || "tailored_resume";
      a.download = `${filename}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleDiscard = () => {
    setResult(null);
    setJobDescription(selectedJob?.jobDescription ?? "");
    setError(null);
  };

  if (result && selectedJob) {
    return (
      <DiffReview
        result={result}
        job={selectedJob}
        onExport={handleExport}
        onDiscard={handleDiscard}
        exporting={exporting}
      />
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
