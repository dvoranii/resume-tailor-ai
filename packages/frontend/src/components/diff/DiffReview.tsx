import type { Resume } from "@resumeai/shared";
import DiffSection from "./DiffSection";
import DiffBullets from "./DiffBullets";
import DiffColumnHeaders from "./DiffColumnHeaders";

interface DiffReviewProps {
  original: Resume;
  tailored: Resume;
  jobTitle: string;
  companyName: string;
  onClose: () => void;
}

export default function DiffReview({
  original,
  tailored,
  jobTitle,
  companyName,
  onClose,
}: DiffReviewProps) {
  return (
    <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between sticky top-0 bg-bg-surface z-10 pb-2 border-b border-border p-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-text-primary font-semibold text-sm">
            Review Changes
          </h3>
          <p className="text-text-muted text-xs">
            {jobTitle} at {companyName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-sm text-text-muted hover:text-text-primary transition-colors px-3 py-1.5"
        >
          Close
        </button>
      </div>

      <div className="p-4">
        <div className="flex flex-col gap-3">
          {original.summary !== tailored.summary && (
            <DiffSection title="Summary">
              <DiffColumnHeaders />
              <div className="grid grid-cols-2 gap-4">
                <p className="text-xs leading-relaxed text-red-300 bg-red-950/40 px-2 py-1 rounded">
                  {original.summary}
                </p>
                <p className="text-xs leading-relaxed text-green-300 bg-green-950/40 px-2 py-1 rounded">
                  {tailored.summary}
                </p>
              </div>
            </DiffSection>
          )}

          {tailored.experience.map((company, ci) => {
            const origCompany = original.experience[ci];
            return company.roles.map((role, ri) => {
              const origRole = origCompany?.roles[ri];
              const bulletsChanged = role.bullets.some(
                (b, bi) => b.content !== origRole?.bullets[bi]?.content
              );
              if (!bulletsChanged) return null;
              return (
                <DiffSection
                  key={`${ci}-${ri}`}
                  title={`${company.companyName} — ${role.title}`}
                >
                  <DiffColumnHeaders />
                  <DiffBullets
                    original={
                      (origRole?.bullets.map((b) => b.content) as string[]) ??
                      []
                    }
                    tailored={role.bullets.map((b) => b.content) as string[]}
                  />
                </DiffSection>
              );
            });
          })}

          {tailored.projects.map((project, pi) => {
            const origProject = original.projects[pi];
            const bulletsChanged = project.bullets.some(
              (b, bi) => b.content !== origProject?.bullets[bi]?.content
            );
            if (!bulletsChanged) return null;
            return (
              <DiffSection key={pi} title={`Project — ${project.name}`}>
                <DiffColumnHeaders />
                <DiffBullets
                  original={origProject?.bullets.map((b) => b.content) ?? []}
                  tailored={project.bullets.map((b) => b.content)}
                />
              </DiffSection>
            );
          })}

          {tailored.skills.map((cat, si) => {
            const origCat = original.skills[si];
            const changed = cat.items.join(",") !== origCat?.items.join(",");
            if (!changed) return null;
            return (
              <DiffSection key={si} title={`Skills — ${cat.category}`}>
                <DiffColumnHeaders />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-wrap gap-1.5">
                    {origCat?.items.map((item, i) => (
                      <span
                        key={i}
                        className="text-xs bg-bg-input border border-border rounded px-2 py-0.5 text-text-muted"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.items.map((item, i) => (
                      <span
                        key={i}
                        className="text-xs bg-green-950/40 border border-green-800 rounded px-2 py-0.5 text-green-300"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </DiffSection>
            );
          })}
        </div>
      </div>
    </div>
  );
}
