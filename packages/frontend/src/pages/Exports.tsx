import { useState, useEffect } from "react";
import { API_BASE } from "../types/jobs";
import { Spinner, SearchInput } from "../components/UI";

interface ExportRecord {
  id: number;
  resumeId: number | null;
  variantId: number | null;
  jobTitle: string | null;
  companyName: string | null;
  fileName: string;
  created_at: string;
}

export default function Exports() {
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null); // ✅ New state

  useEffect(() => {
    fetchExports();
  }, []);

  const fetchExports = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const url = searchTerm
        ? `${API_BASE}/export/exports?search=${encodeURIComponent(searchTerm)}`
        : `${API_BASE}/export/exports`;
      const res = await fetch(url);
      const data = await res.json();
      setExports(data);
    } catch (error) {
      console.error("Failed to fetch exports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: number, fileName: string) => {
    setDownloadingId(id);
    try {
      const res = await fetch(`${API_BASE}/export/exports/${id}/download`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download export.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (id: number) => {
    setIsPreviewLoading(true);
    try {
      const res = await fetch(`${API_BASE}/export/exports/${id}/download`);
      if (!res.ok) throw new Error("Preview failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (error) {
      console.error("Preview failed:", error);
      alert("Failed to load PDF preview.");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const handleSearch = (term: string) => {
    setSearch(term);
    fetchExports(term);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary font-semibold text-lg">Exports</h1>
        <div className="flex items-center gap-2">
          {/* ✅ Replace form with SearchInput */}
          <SearchInput
            placeholder="Search by job title or company..."
            onSearch={handleSearch}
            debounceMs={300}
          />
        </div>
      </div>
      {loading && <p className="text-text-muted">Loading exports...</p>}

      {!loading && exports.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-text-muted">No exports yet.</p>
          <p className="text-text-muted text-sm mt-1">
            Export a resume from the Resume Builder to see it here.
          </p>
        </div>
      )}

      {!loading && exports.length > 0 && (
        <div className="flex flex-col gap-3">
          {exports.map((exp) => (
            <div
              key={exp.id}
              className="flex items-center justify-between bg-bg-surface border border-border rounded-lg px-4 py-3"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-text-primary font-medium">
                  {exp.jobTitle || "Base Resume"}
                </span>
                {exp.companyName && (
                  <span className="text-text-muted text-sm block">
                    {exp.companyName}
                  </span>
                )}
                <span className="text-text-muted text-xs">
                  Exported: {formatDate(exp.created_at)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handlePreview(exp.id)}
                  className="cursor-pointer px-3 py-1.5 text-sm font-medium text-accent border border-accent/40 rounded-md transition-colors hover:bg-accent/10 hover:border-accent"
                >
                  Preview
                </button>
                <button
                  onClick={() => handleDownload(exp.id, exp.fileName)}
                  disabled={downloadingId === exp.id}
                  className="cursor-pointer px-3 py-1.5 text-sm font-medium text-white bg-accent border border-accent rounded-md transition-colors hover:bg-accent/90 hover:border-accent/90 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] flex items-center justify-center"
                >
                  {downloadingId === exp.id ? (
                    <Spinner size="sm" color="white" />
                  ) : (
                    "Download"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isPreviewLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface rounded-lg p-6 flex flex-col items-center gap-3">
            <Spinner size="lg" color="accent" />
            <p className="text-text-muted text-sm">Loading preview...</p>
          </div>
        </div>
      )}

      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={closePreview}
        >
          <div
            className="bg-bg-surface rounded-lg w-full max-w-4xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h3 className="text-text-primary font-semibold">PDF Preview</h3>
              <button
                onClick={closePreview}
                className="text-text-muted hover:text-text-primary text-sm px-3 py-1"
              >
                Close
              </button>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
