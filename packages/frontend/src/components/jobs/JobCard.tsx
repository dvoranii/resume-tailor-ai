import { Trash2, ExternalLink } from "lucide-react";
import { type Job, statusColors } from "../../types/jobs";

export default function JobCard({
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
