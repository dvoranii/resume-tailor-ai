import { useState } from "react";
import {
  Trash2,
  ExternalLink,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { type Job, statusColors } from "../../types/jobs";
import { API_BASE } from "../../types/jobs";
import type { Resume } from "@resumeai/shared";
import DiffModal from "../diff/DiffModal";
// import DiffReview from "../diff/DiffReview";

export default function JobCard({
  job,
  onDelete,
}: {
  job: Job;
  onDelete: (id: number) => void;
}) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffData, setDiffData] = useState<{
    original: Resume;
    tailored: Resume;
  } | null>(null);
  const [loadingDiff, setLoadingDiff] = useState(false);

  const {
    id,
    jobTitle,
    companyName,
    status,
    fitScore,
    suggestedFocus,
    reasoning,
    jobUrl,
    variantId,
  } = job;

  const handleViewChanges = async () => {
    if (!variantId) return;
    setLoadingDiff(true);
    try {
      const variantRes = await fetch(
        `${API_BASE}/resume/variants/${variantId}`
      );
      const variantData = await variantRes.json();
      const baseResumeId = variantData.resumeId;
      if (!baseResumeId) {
        alert("Could not find base resume for this variant.");
        return;
      }
      const originalRes = await fetch(`${API_BASE}/resume?id=${baseResumeId}`);
      const originalData = await originalRes.json();
      setDiffData({
        original: originalData,
        tailored: variantData.tailoredData,
      });
      setShowDiffModal(true);
    } catch (error) {
      console.error("Failed to load diff:", error);
      alert("Failed to load changes.");
    } finally {
      setLoadingDiff(false);
    }
  };

  return (
    <>
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
            {status === "tailored" && variantId && (
              <button
                onClick={handleViewChanges}
                disabled={loadingDiff}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                <Eye size={12} />
                {loadingDiff ? "Loading..." : "View Changes"}
              </button>
            )}
          </div>

          {suggestedFocus && (
            <div className="flex items-start gap-1.5 mt-1">
              <Sparkles size={13} className="text-accent shrink-0 mt-0.5" />
              <p className="text-xs text-text-muted italic">{suggestedFocus}</p>
            </div>
          )}

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

      {showDiffModal && diffData && (
        <DiffModal
          original={diffData.original}
          tailored={diffData.tailored}
          jobTitle={jobTitle}
          companyName={companyName}
          onClose={() => setShowDiffModal(false)}
        />
      )}
    </>
  );
}
