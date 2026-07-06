import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const API_BASE = "http://localhost:3001/api/v1";

interface Job {
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
}

const statusColors = {
  new: "bg-bg-input text-text-muted",
  tailored: "bg-blue-950/40 text-blue-300 border border-blue-800",
  applied: "bg-green-950/40 text-green-300 border border-green-800",
};

function AddJobForm({ onAdd }: { onAdd: (job: Job) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    jobTitle: "",
    jobUrl: "",
    jobDescription: "",
    fitScore: "",
    seniorityLevel: "",
    salary: "",
    suggestedFocus: "",
    reasoning: "",
  });

  const set =
    (field: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.companyName || !form.jobTitle) {
      setError("Company name and job title are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fitScore: form.fitScore ? Number(form.fitScore) : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to add job");
        return;
      }
      onAdd({
        ...form,
        id: data.id,
        fitScore: form.fitScore ? Number(form.fitScore) : null,
        status: "new",
        variantId: null,
      } as Job);
      setForm({
        companyName: "",
        jobTitle: "",
        jobUrl: "",
        jobDescription: "",
        fitScore: "",
        seniorityLevel: "",
        salary: "",
        suggestedFocus: "",
        reasoning: "",
      });
      setExpanded(false);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-border rounded-lg bg-bg-surface overflow-hidden">
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-bg-input transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
          <Plus size={15} />
          Add Job Manually
        </div>
        {expanded ? (
          <ChevronUp size={15} className="text-text-muted" />
        ) : (
          <ChevronDown size={15} className="text-text-muted" />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 px-4 pb-4 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                {
                  field: "companyName",
                  label: "Company Name",
                  placeholder: "Acme Inc.",
                  required: true,
                },
                {
                  field: "jobTitle",
                  label: "Job Title",
                  placeholder: "Full Stack Developer",
                  required: true,
                },
                {
                  field: "jobUrl",
                  label: "Job URL",
                  placeholder: "https://linkedin.com/jobs/...",
                },
                {
                  field: "fitScore",
                  label: "Fit Score (1-10)",
                  placeholder: "8",
                },
                {
                  field: "seniorityLevel",
                  label: "Seniority Level",
                  placeholder: "Mid",
                },
                {
                  field: "salary",
                  label: "Salary",
                  placeholder: "$90,000 - $110,000",
                },
              ] as {
                field: keyof typeof form;
                label: string;
                placeholder: string;
                required?: boolean;
              }[]
            ).map(({ field, label, placeholder, required }) => (
              <div key={field} className="flex flex-col gap-1.5">
                <label className="text-xs text-text-muted">
                  {label}
                  {required && <span className="text-red-400 ml-1">*</span>}
                </label>
                <input
                  type="text"
                  value={form[field]}
                  onChange={set(field)}
                  placeholder={placeholder}
                  className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted">Job Description</label>
            <textarea
              value={form.jobDescription}
              onChange={set("jobDescription")}
              placeholder="Paste the full job description here..."
              rows={6}
              className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted">Suggested Focus</label>
            <input
              type="text"
              value={form.suggestedFocus}
              onChange={set("suggestedFocus")}
              placeholder="Emphasize React, TypeScript, and API design"
              className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted">Reasoning</label>
            <textarea
              value={form.reasoning}
              onChange={set("reasoning")}
              placeholder="Why this job is a good fit..."
              rows={3}
              className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm px-4 py-2 rounded-md transition-colors"
            >
              <Plus size={14} />
              {submitting ? "Adding..." : "Add Job"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function JobCard({
  job,
  onDelete,
}: {
  job: Job;
  onDelete: (id: number) => void;
}) {
  const {
    id,
    jobTitle,
    companyName,
    status,
    fitScore,
    suggestedFocus,
    jobUrl,
  } = job;

  return (
    <div className="flex items-start gap-4 bg-bg-surface border border-border rounded-lg px-4 py-3">
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-text-primary">
            {jobTitle}
          </span>
          <span className="text-text-muted text-sm">at {companyName}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${statusColors[status]}`}
          >
            {status}
          </span>
          {fitScore && (
            <span className="text-xs text-text-muted bg-bg-input px-2 py-0.5 rounded-full">
              Fit: {fitScore}/10
            </span>
          )}
        </div>
        {suggestedFocus && (
          <p className="text-xs text-text-muted truncate">
            Focus: {suggestedFocus}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {jobUrl && (
          <a
            href={jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-muted hover:text-accent transition-colors"
          >
            <ExternalLink size={15} />
          </a>
        )}
        <button
          onClick={() => onDelete(id)}
          className="text-text-muted hover:text-red-400 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    fetchJobs();
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
          {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
        </span>
      </div>

      <AddJobForm onAdd={handleAdd} />

      {loading && <p className="text-text-muted text-sm">Loading jobs...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border rounded-lg">
          <p className="text-text-muted text-sm">No jobs added yet.</p>
          <p className="text-text-muted text-xs mt-1">
            Use the form above to add your first job.
          </p>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
