import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE } from "../types/jobs";
import { setActiveVariantId } from "../utils/activeResume";

interface Variant {
  id: number;
  jobId: number | null;
  jobTitle: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
  jobUrl: string | null;
  fitScore: number | null;
}

export default function BaseResumeVariants() {
  const { id } = useParams<{ id: string }>();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [baseResumeName, setBaseResumeName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch base resume name
        const resumeRes = await fetch(`${API_BASE}/resume/list`);
        const resumes = await resumeRes.json();
        const found = resumes.find((r: any) => r.id === Number(id));
        if (found) setBaseResumeName(found.name);

        // Fetch variants for this base resume
        const variantsRes = await fetch(`${API_BASE}/resume/${id}/variants`);
        const data = await variantsRes.json();
        setVariants(data);
      } catch (error) {
        console.error("Error fetching variants:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleEditVariant = (variantId: number) => {
    setActiveVariantId(variantId);
    navigate(`/resume?variantId=${variantId}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary font-semibold text-lg">
          Variants for "{baseResumeName || "Loading..."}"
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="text-text-muted hover:text-text-primary text-sm"
        >
          ← Back
        </button>
      </div>

      {loading && <p className="text-text-muted">Loading variants...</p>}

      {!loading && variants.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-text-muted">No variants yet.</p>
          <p className="text-text-muted text-sm mt-1">
            Tailor a resume for a job to create a variant.
          </p>
        </div>
      )}

      {!loading && variants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="border border-border rounded-lg p-4 bg-bg-surface"
            >
              <h3 className="text-text-primary font-medium">
                {variant.jobTitle}
              </h3>
              <p className="text-text-muted text-sm">{variant.companyName}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                <span>
                  Tailored: {new Date(variant.createdAt).toLocaleDateString()}
                </span>
                {variant.fitScore && <span>Fit: {variant.fitScore}/10</span>}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={() => handleEditVariant(variant.id)}
                  className="text-accent hover:underline text-sm"
                >
                  Edit Variant
                </button>
                {variant.jobUrl && (
                  <a
                    href={variant.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-muted hover:text-accent text-sm"
                  >
                    View Job
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
