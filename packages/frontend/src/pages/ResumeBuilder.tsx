import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Download, ArrowLeft } from "lucide-react";
import {
  ResumeBuilderProvider,
  useResumeBuilder,
} from "../context/ResumeBuilderContext";
import ResumeForm from "../components/resume/ResumeForm";
import ResumePreview from "../components/resume/ResumePreview";
import TemplateConfigPanel from "../components/resume/TemplateConfigPanel";

import {
  clearActiveResumeId,
  getActiveResumeId,
  setActiveResumeId,
  getActiveVariantId,
  setActiveVariantId,
  clearActiveVariantId,
  clearActiveState,
} from "../utils/activeResume";

function ResumeBuilderContent() {
  const {
    exportPdf,
    // resume,
    isLoading,
    loadResume,
    loadVariant,
    saveAsNew,
    resumeName,
    isVariant,
    variantJobTitle,
    baseResumeIdForVariant,
    variantCompany,
  } = useResumeBuilder();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get("id");
  const variantId = searchParams.get("variantId");
  const isNew = searchParams.get("new") === "true";

  const navigate = useNavigate();

  useEffect(() => {
    if (isNew) {
      loadResume(null);
      clearActiveState();
    } else if (variantId) {
      loadVariant(Number(variantId));
      setActiveVariantId(Number(variantId));
      clearActiveResumeId();
    } else if (resumeId) {
      loadResume(Number(resumeId));
      setActiveResumeId(Number(resumeId));
      clearActiveVariantId();
    } else {
      const activeVariant = getActiveVariantId();
      if (activeVariant) {
        navigate(`/resume?variantId=${activeVariant}`);
        return;
      }
      const activeResume = getActiveResumeId();
      if (activeResume) {
        navigate(`/resume?id=${activeResume}`);
        return;
      }
      loadResume();
    }
  }, [resumeId, variantId, isNew, loadResume, loadVariant, navigate]);

  useEffect(() => {
    if (isVariant && baseResumeIdForVariant && variantId) {
      const currentBaseResumeId = searchParams.get("baseResumeId");
      if (currentBaseResumeId !== String(baseResumeIdForVariant)) {
        navigate(
          `/resume?variantId=${variantId}&baseResumeId=${baseResumeIdForVariant}`,
          { replace: true }
        );
      }
    }
  }, [isVariant, baseResumeIdForVariant, variantId, navigate, searchParams]);

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
    try {
      const newId = await saveAsNew(name, isDefault);
      setActiveResumeId(newId);
      clearActiveVariantId();
      navigate(`/resume?id=${newId}`);
    } catch (error) {
      console.error("Save as new failed:", error);
    }
  };

  const handleBackToVariants = () => {
    clearActiveVariantId();
    if (baseResumeIdForVariant) {
      navigate(`/base-resume/${baseResumeIdForVariant}/variants`);
    } else {
      navigate(-1);
    }
  };

  const headerTitle = isVariant
    ? `Variant: ${variantJobTitle} at ${variantCompany}`
    : resumeName || "Untitled";

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span>Resume Builder</span>
          <span>/</span>
          <span className="text-text-primary">
            {isLoading ? "Loading..." : headerTitle}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-red-400 text-xs">{error}</span>}

          {isVariant && (
            <button
              onClick={() => handleBackToVariants()}
              className="flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm px-3 py-2 rounded-md transition-colors"
            >
              <ArrowLeft size={15} />
              Back to Variants
            </button>
          )}

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
        <ResumeForm
          isVariant={isVariant}
          resumeId={resumeId ? Number(resumeId) : undefined}
        />
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
