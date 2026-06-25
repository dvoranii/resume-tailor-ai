import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import { useResumeBuilder } from "../../../context/ResumeBuilderContext";
import type { Education } from "@resumeai/shared";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => crypto.randomUUID();

const newEducation = (): Education => ({
  id: uid(),
  institution: "",
  degree: "",
  field: "",
  graduationYear: "",
  displayOrder: 0,
});

// ─── Education Card ───────────────────────────────────────────────────────────

interface EducationCardProps {
  education: Education;
  onChange: (updated: Education) => void;
  onDelete: () => void;
}

function EducationCard({ education, onChange, onDelete }: EducationCardProps) {
  const [expanded, setExpanded] = useState(true);

  const setField = (field: keyof Education) => (value: string) =>
    onChange({ ...education, [field]: value });

  return (
    <div className="border border-border rounded-lg bg-bg-surface">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical size={16} className="text-text-muted shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {education.institution || "New Institution"}
          </p>
          <p className="text-xs text-text-muted truncate">
            {education.degree && education.field
              ? `${education.degree} in ${education.field}`
              : "Degree details not set"}
          </p>
        </div>
        <button
          onClick={onDelete}
          className="text-text-muted hover:text-red-400 transition-colors"
        >
          <Trash2 size={15} />
        </button>
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Fields */}
      {expanded && (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4 border-t border-border pt-4">
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="text-xs text-text-muted">Institution</label>
            <input
              type="text"
              value={education.institution}
              onChange={(e) => setField("institution")(e.target.value)}
              placeholder="University of Toronto"
              className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted">Degree</label>
            <input
              type="text"
              value={education.degree}
              onChange={(e) => setField("degree")(e.target.value)}
              placeholder="Bachelor of Science"
              className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted">Field of Study</label>
            <input
              type="text"
              value={education.field}
              onChange={(e) => setField("field")(e.target.value)}
              placeholder="Computer Science"
              className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted">Graduation Year</label>
            <input
              type="text"
              value={education.graduationYear}
              onChange={(e) => setField("graduationYear")(e.target.value)}
              placeholder="2021"
              className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EducationForm() {
  const { resume, updateEducation } = useResumeBuilder();

  const addEducation = () =>
    updateEducation([
      ...resume.education,
      { ...newEducation(), displayOrder: resume.education.length },
    ]);

  const updateEntry = (index: number, updated: Education) =>
    updateEducation(
      resume.education.map((e, i) => (i === index ? updated : e))
    );

  const deleteEntry = (index: number) =>
    updateEducation(resume.education.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-text-primary font-semibold text-base">
            Education
          </h2>
          <p className="text-text-muted text-sm">
            Add your academic background.
          </p>
        </div>
        <button
          onClick={addEducation}
          className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm px-3 py-2 rounded-md transition-colors shrink-0"
        >
          <Plus size={15} />
          Add Education
        </button>
      </div>

      {resume.education.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg">
          <p className="text-text-muted text-sm">No education added yet.</p>
          <button
            onClick={addEducation}
            className="mt-3 text-accent hover:text-accent-hover text-sm transition-colors"
          >
            Add your first entry
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {resume.education.map((entry, i) => (
            <EducationCard
              key={entry.id}
              education={entry}
              onChange={(updated) => updateEntry(i, updated)}
              onDelete={() => deleteEntry(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
