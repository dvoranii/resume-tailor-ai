import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Download } from "lucide-react";
import {
  ResumeBuilderProvider,
  useResumeBuilder,
} from "../context/ResumeBuilderContext";
import ResumeForm from "../components/resume/ResumeForm";
import ResumePreview from "../components/resume/ResumePreview";
import TemplateConfigPanel from "../components/resume/TemplateConfigPanel";

function ResumeBuilderContent() {
  const { exportPdf, resume, isLoading, loadResume, saveAsNew, resumeName } =
    useResumeBuilder();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get("id");
  const isNew = searchParams.get("new") === "true";

  useEffect(() => {
    if (isNew) {
      loadResume(null);
    } else if (resumeId) {
      loadResume(Number(resumeId));
    } else {
      loadResume();
    }
  }, [resumeId, isNew, loadResume]);

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

  const handleSaveAsNew = async () => {
    const name = prompt("Enter a name for this base resume: ", "My Resume");
    if (name === null) return;
    const isDefault = confirm("Set as default?");
    await saveAsNew(name, isDefault);
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span>Resume Builder</span>
          <span>/</span>
          <span className="text-text-primary">
            {isLoading ? "Loading..." : resumeName || "Untitled"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-red-400 text-xs">{error}</span>}

          <button
            onClick={handleSaveAsNew}
            className="flex items-center gap-1.5 bg-accent/20 hover:bg-accent/30 text-accent text-sm px-3 py-2 rounded-md transition-colors"
          >
            Save as New
          </button>

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
