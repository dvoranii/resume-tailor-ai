import type { Resume } from "@resumeai/shared";

function getMissingFieldList(resume: Resume): string[] {
  const missing: string[] = [];
  const p = resume.personal;

  if (!p.name?.trim()) missing.push("Name");
  if (!p.email?.trim()) missing.push("Email");
  if (!p.location?.trim()) missing.push("Location");
  if (!p.title?.trim()) missing.push("Title");
  if (!resume.summary?.trim() || resume.summary.length < 50)
    missing.push("Summary (at least 50 characters)");

  const hasExperience = resume.experience.some((company) =>
    company.roles?.some((role) => role.bullets?.length > 0)
  );
  if (!hasExperience)
    missing.push("Experience (at least 1 role with 1 bullet)");

  const hasProjects = resume.projects.some(
    (project) => project.bullets?.length > 0
  );
  if (!hasProjects) missing.push("Projects (at least 1 project with 1 bullet)");

  if (resume.education.length === 0)
    missing.push("Education (at least 1 entry)");

  return missing;
}

export function isResumeComplete(resume: Resume): boolean {
  return getMissingFieldList(resume).length === 0;
}

export function getMissingFields(resume: Resume): string[] {
  return getMissingFieldList(resume);
}
