import { useState } from "react";
import { Download } from "lucide-react";
import {
  ResumeBuilderProvider,
  useResumeBuilder,
} from "../context/ResumeBuilderContext";
import ResumeForm from "../components/resume/ResumeForm";
import ResumePreview from "../components/resume/ResumePreview";
import TemplateConfigPanel from "../components/resume/TemplateConfigPanel";

function ResumeBuilderContent() {
  const { exportPdf } = useResumeBuilder();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      await exportPdf();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span>Resume Builder</span>
          <span>/</span>
          <span className="text-text-primary">My Resume</span>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-red-400 text-xs">{error}</span>}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm px-3 py-2 rounded-md transition-colors"
          >
            <Download size={15} />
            {exporting ? "Generating..." : "Export PDF"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <ResumeForm />
        <div className="flex flex-col flex-1 min-w-0 bg-bg-surface rounded-lg border border-border overflow-hidden">
          <TemplateConfigPanel />
          <ResumePreview />
        </div>
      </div>
    </div>
  );
}

export default function ResumeBuilder() {
  return (
    <ResumeBuilderProvider>
      <ResumeBuilderContent />
    </ResumeBuilderProvider>
  );
}
