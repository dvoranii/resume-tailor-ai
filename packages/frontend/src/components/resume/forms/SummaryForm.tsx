import { useResumeBuilder } from "../../../context/ResumeBuilderContext";

export default function SummaryForm() {
  const { resume, updateSummary } = useResumeBuilder();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-text-primary font-semibold text-base">Summary</h2>
        <p className="text-text-muted text-sm">
          A short professional summary that appears at the top of your resume.
          This is the first thing the AI will tailor per job.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-text-muted">
          Professional Summary
          <span className="text-red-400 ml-1">*</span>
        </label>
        <textarea
          value={resume.summary}
          onChange={(e) => updateSummary(e.target.value)}
          placeholder="Full Stack Developer with X years of experience building scalable web applications..."
          rows={6}
          className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
        />
        <div className="flex justify-end">
          <span
            className={`text-xs ${
              resume.summary.length > 300 ? "text-red-400" : "text-text-muted"
            }`}
          >
            {resume.summary.length} / 300
          </span>
        </div>
      </div>
    </div>
  );
}
