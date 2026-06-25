import { useState, useRef } from "react";
import { Plus, Trash2, GripVertical, X } from "lucide-react";
import { useResumeBuilder } from "../../../context/ResumeBuilderContext";
import type { SkillCategory } from "@resumeai/shared";

const uid = () => crypto.randomUUID();

const newCategory = (): SkillCategory => ({
  id: uid(),
  category: "",
  items: [],
  displayOrder: 0,
});

interface SkillChipProps {
  label: string;
  onDelete: () => void;
}

function SkillChip({ label, onDelete }: SkillChipProps) {
  return (
    <span className="inline-flex items-center gap-1 bg-bg-input border border-border rounded-md px-2.5 py-1 text-xs text-text-primary">
      {label}
      <button
        onClick={onDelete}
        className="text-text-muted hover:text-red-400 transition-colors ml-0.5"
        aria-label={`Remove ${label}`}
      >
        <X size={11} />
      </button>
    </span>
  );
}

interface CategoryCardProps {
  category: SkillCategory;
  onChange: (updated: SkillCategory) => void;
  onDelete: () => void;
}

function CategoryCard({ category, onChange, onDelete }: CategoryCardProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addSkill = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || category.items.includes(trimmed)) {
      setInputValue("");
      return;
    }
    onChange({ ...category, items: [...category.items, trimmed] });
    setInputValue("");
    inputRef.current?.focus();
  };

  const deleteSkill = (index: number) =>
    onChange({
      ...category,
      items: category.items.filter((_, i) => i !== index),
    });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }

    if (
      e.key === "Backspace" &&
      inputValue === "" &&
      category.items.length > 0
    ) {
      deleteSkill(category.items.length - 1);
    }
  };

  return (
    <div className="border border-border rounded-lg bg-bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <GripVertical size={16} className="text-text-muted shrink-0" />
        <input
          type="text"
          value={category.category}
          onChange={(e) => onChange({ ...category, category: e.target.value })}
          placeholder="e.g. Frontend, Backend, Tools"
          className="flex-1 bg-bg-input border border-border rounded-md px-3 py-2 text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={onDelete}
          className="text-text-muted hover:text-red-400 transition-colors shrink-0"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div
        className="min-h-[42px] flex flex-wrap gap-1.5 bg-bg-input border border-border rounded-md px-3 py-2 cursor-text focus-within:border-accent transition-colors"
        onClick={() => inputRef.current?.focus()}
      >
        {category.items.map((skill, i) => (
          <SkillChip key={i} label={skill} onDelete={() => deleteSkill(i)} />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addSkill}
          placeholder={
            category.items.length === 0
              ? "Type a skill and press Enter..."
              : "Add another..."
          }
          className="flex-1 min-w-[120px] bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
      </div>

      <p className="text-xs text-text-muted">
        Press{" "}
        <kbd className="bg-bg-base border border-border rounded px-1 py-0.5 font-mono text-[10px]">
          Enter
        </kbd>{" "}
        or{" "}
        <kbd className="bg-bg-base border border-border rounded px-1 py-0.5 font-mono text-[10px]">
          ,
        </kbd>{" "}
        to add a skill. Backspace removes the last one.
      </p>
    </div>
  );
}

export default function SkillsForm() {
  const { resume, updateSkills } = useResumeBuilder();

  const addCategory = () =>
    updateSkills([
      ...resume.skills,
      { ...newCategory(), displayOrder: resume.skills.length },
    ]);

  const updateCategory = (index: number, updated: SkillCategory) =>
    updateSkills(resume.skills.map((c, i) => (i === index ? updated : c)));

  const deleteCategory = (index: number) =>
    updateSkills(resume.skills.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-text-primary font-semibold text-base">Skills</h2>
          <p className="text-text-muted text-sm">
            Group skills by category. The AI can reorder items within each
            category to match a job's priorities.
          </p>
        </div>
        <button
          onClick={addCategory}
          className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm px-3 py-2 rounded-md transition-colors shrink-0"
        >
          <Plus size={15} />
          Add Category
        </button>
      </div>

      {resume.skills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg">
          <p className="text-text-muted text-sm">No skill categories yet.</p>
          <button
            onClick={addCategory}
            className="mt-3 text-accent hover:text-accent-hover text-sm transition-colors"
          >
            Add your first category
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {resume.skills.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onChange={(updated) => updateCategory(i, updated)}
              onDelete={() => deleteCategory(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
