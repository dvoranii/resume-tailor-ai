import { useState } from "react";
import {
  Trash2,
  ExternalLink,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { type Job, statusColors } from "../../types/jobs";

export default function JobCard({
  job,
  onDelete,
}: {
  job: Job;
  onDelete: (id: number) => void;
}) {
  const [showReasoning, setShowReasoning] = useState(false);

  const {
    id,
    jobTitle,
    companyName,
    status,
    fitScore,
    suggestedFocus,
    reasoning,
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
          {fitScore !== null && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                fitScore >= 70
                  ? "bg-green-950/40 text-green-300 border border-green-800"
                  : fitScore >= 50
                  ? "bg-yellow-950/40 text-yellow-300 border border-yellow-800"
                  : "bg-red-950/40 text-red-300 border border-red-800"
              }`}
            >
              Fit: {fitScore}/100
            </span>
          )}
        </div>

        {/* Suggested Focus */}
        {suggestedFocus && (
          <div className="flex items-start gap-1.5 mt-1">
            <Sparkles size={13} className="text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted italic">{suggestedFocus}</p>
          </div>
        )}

        {/* Reasoning - Accordion Style */}
        {reasoning && (
          <div className="mt-1">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-1 text-xs text-text-muted/70 hover:text-text-muted transition-colors"
            >
              <Info size={12} />
              <span>AI Reasoning</span>
              {showReasoning ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
            {showReasoning && (
              <div className="mt-1 p-2 bg-bg-input/50 rounded-md border border-border/50 text-xs text-text-muted leading-relaxed">
                {reasoning}
              </div>
            )}
          </div>
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
