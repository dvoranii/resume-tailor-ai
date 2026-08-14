import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  setActiveResumeId,
  getActiveResumeId,
  clearActiveResumeId,
  clearActiveVariantId,
} from "../utils/activeResume";

import { API_BASE } from "../types/jobs";

interface RawResume {
  id: number;
  name: string;
  summary: string;
  isDefault: number;
  isComplete: number;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
}
interface BaseResume {
  id: number;
  name: string;
  summary: string;
  isDefault: boolean;
  isComplete: boolean;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
}

function convertToBaseResume(raw: RawResume): BaseResume {
  return {
    ...raw,
    isDefault: raw.isDefault === 1,
    isComplete: raw.isComplete === 1,
  };
}

export default function Dashboard() {
  const [resumes, setResumes] = useState<BaseResume[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await fetch(`${API_BASE}/resume/list`);
      const rawData: RawResume[] = await res.json();
      const mapped = rawData.map(convertToBaseResume);
      setResumes(mapped);
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
    } finally {
      setLoading(false);
    }
  };

  const setDefault = async (id: number) => {
    try {
      await fetch(`${API_BASE}/resume/${id}/default`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      setActiveResumeId(id);
      clearActiveVariantId();
      fetchResumes();
    } catch (error) {
      console.error("Failed to set default:", error);
    }
  };

  const deleteResume = async (id: number) => {
    if (
      !confirm(
        "Delete this resume? (Variants will remain, but the base will be removed.)"
      )
    )
      return;
    try {
      await fetch(`${API_BASE}/resume/${id}`, { method: "DELETE" });
      const activeId = getActiveResumeId();
      if (activeId === id) clearActiveResumeId();
      fetchResumes();
    } catch (error) {
      console.error("Failed to delete resume:", error);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary font-semibold text-lg">Dashboard</h1>
        <button
          onClick={() => navigate("/resume?new=true")}
          className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-md text-sm"
        >
          + New Base Resume
        </button>
      </div>

      {loading && <p className="text-text-muted">Loading...</p>}

      {!loading && resumes.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-text-muted">No base resumes yet.</p>
          <p className="text-text-muted text-sm mt-1">
            Click "+ New Base Resume" to create your first one.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resumes.map((resume) => (
          <div
            key={resume.id}
            className="border border-border rounded-lg p-4 bg-bg-surface"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-text-primary font-medium">{resume.name}</h3>
              <div className="flex items-center gap-2">
                {resume.isComplete ? (
                  <span className="text-xs text-green-400">✅ Complete</span>
                ) : (
                  <span className="text-xs text-yellow-400">⚠️ Incomplete</span>
                )}
                {resume.isDefault && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
                    Default
                  </span>
                )}
              </div>
            </div>
            <p className="text-text-muted text-sm mt-1 line-clamp-2">
              {resume.summary || "No summary"}
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
              <span>{resume.variantCount} variants</span>
              <span>
                Updated: {new Date(resume.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => {
                  setActiveResumeId(resume.id);
                  navigate(`/resume?id=${resume.id}`);
                }}
                className="text-accent hover:underline text-sm"
              >
                Open
              </button>
              {resume.variantCount > 0 && (
                <button
                  onClick={() => navigate(`/base-resume/${resume.id}/variants`)}
                  className="text-text-muted hover:text-accent text-sm"
                >
                  View Variants ({resume.variantCount})
                </button>
              )}
              {!resume.isDefault && (
                <button
                  onClick={() => setDefault(resume.id)}
                  className="text-text-muted hover:text-accent text-sm"
                >
                  Set Default
                </button>
              )}
              <button
                onClick={() => deleteResume(resume.id)}
                className="text-text-muted hover:text-red-400 text-sm ml-auto"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
