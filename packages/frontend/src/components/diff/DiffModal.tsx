import type { Resume } from "@resumeai/shared";
import DiffReview from "./DiffReview";

interface DiffModalProps {
  original: Resume;
  tailored: Resume;
  jobTitle: string;
  companyName: string;
  onClose: () => void;
}

export default function DiffModal({
  original,
  tailored,
  jobTitle,
  companyName,
  onClose,
}: DiffModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-surface border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        <DiffReview
          original={original}
          tailored={tailored}
          jobTitle={jobTitle}
          companyName={companyName}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
