import { useState } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { API_BASE, type Job } from "../../types/jobs";

export default function AddJobForm({ onAdd }: { onAdd: (job: Job) => void }) {
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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
        collectionId: null,
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
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted">Job Description</label>
            <textarea
              name="jobDescription"
              value={form.jobDescription}
              onChange={handleChange}
              placeholder="Paste the full job description here..."
              rows={6}
              className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted">Suggested Focus</label>
            <input
              type="text"
              name="suggestedFocus"
              value={form.suggestedFocus}
              onChange={handleChange}
              placeholder="Emphasize React, TypeScript, and API design"
              className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted">Reasoning</label>
            <textarea
              name="reasoning"
              value={form.reasoning}
              onChange={handleChange}
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
