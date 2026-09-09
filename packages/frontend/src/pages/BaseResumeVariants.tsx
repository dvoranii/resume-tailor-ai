import { useParams, useNavigate } from "react-router-dom";
import { setActiveVariantId } from "../utils/activeResume";
import { useBaseResume } from "../hooks/useBaseResume";
import { useBaseResumeVariants } from "../hooks/useBaseResumeVariants";

export default function BaseResumeVariants() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const baseResumeId = Number(id);

  const { name: baseResumeName, loading: nameLoading } =
    useBaseResume(baseResumeId);
  const { variants, loading: variantsLoading } =
    useBaseResumeVariants(baseResumeId);

  const handleEditVariant = (variantId: number) => {
    setActiveVariantId(variantId);
    navigate(`/resume?variantId=${variantId}`);
  };

  const handleBack = () => {
    navigate(`/resume?id=${baseResumeId}`);
  };

  const loading = nameLoading || variantsLoading;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-text-primary font-semibold text-lg">
          Variants for "{baseResumeName || "Loading..."}"
        </h1>
        <button
          onClick={handleBack}
          className="text-text-muted hover:text-text-primary text-sm"
        >
          ← Back to Resume
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
