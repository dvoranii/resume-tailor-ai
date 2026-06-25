import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import { useResumeBuilder } from "../../../context/ResumeBuilderContext";
import type { Project, ProjectBullet } from "@resumeai/shared";

const uid = () => crypto.randomUUID();

const newBullet = (): ProjectBullet => ({
  id: uid(),
  content: "",
  displayOrder: 0,
});

const newProject = (): Project => ({
  id: uid(),
  name: "",
  url: "",
  bullets: [newBullet()],
  displayOrder: 0,
});

interface BulletRowProps {
  bullet: ProjectBullet;
  onChange: (value: string) => void;
  onDelete: () => void;
}

function BulletRow({ bullet, onChange, onDelete }: BulletRowProps) {
  return (
    <div className="flex items-start gap-2">
      <GripVertical size={15} className="text-text-muted mt-2.5 shrink-0" />
      <input
        type="text"
        value={bullet.content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe a feature, tech choice, or outcome..."
        className="flex-1 bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
      />
      <button
        onClick={onDelete}
        className="text-text-muted hover:text-red-400 transition-colors mt-2"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  onChange: (updated: Project) => void;
  onDelete: () => void;
}

function ProjectCard({ project, onChange, onDelete }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(true);

  const setField = (field: keyof Project) => (value: string) =>
    onChange({ ...project, [field]: value });

  const updateBullet = (index: number, value: string) => {
    const updated = project.bullets.map((b, i) =>
      i === index ? { ...b, content: value } : b
    );
    onChange({ ...project, bullets: updated });
  };

  const addBullet = () =>
    onChange({
      ...project,
      bullets: [
        ...project.bullets,
        { ...newBullet(), displayOrder: project.bullets.length },
      ],
    });

  const deleteBullet = (index: number) =>
    onChange({
      ...project,
      bullets: project.bullets.filter((_, i) => i !== index),
    });

  return (
    <div className="border border-border rounded-lg bg-bg-surface">
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical size={16} className="text-text-muted shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {project.name || "New Project"}
          </p>
          {project.url && (
            <p className="text-xs text-text-muted truncate">{project.url}</p>
          )}
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

      {expanded && (
        <div className="flex flex-col gap-4 px-4 pb-4 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted">Project Name</label>
              <input
                type="text"
                value={project.name}
                onChange={(e) => setField("name")(e.target.value)}
                placeholder="Full Stack Fanatic"
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted">
                URL{" "}
                <span className="text-text-muted opacity-60">(optional)</span>
              </label>
              <input
                type="text"
                value={project.url ?? ""}
                onChange={(e) => setField("url")(e.target.value)}
                placeholder="github.com/you/project"
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-text-muted">Bullets</label>
            {project.bullets.map((bullet, i) => (
              <BulletRow
                key={bullet.id}
                bullet={bullet}
                onChange={(value) => updateBullet(i, value)}
                onDelete={() => deleteBullet(i)}
              />
            ))}
            <button
              onClick={addBullet}
              className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors mt-1 w-fit"
            >
              <Plus size={13} />
              Add Bullet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectsForm() {
  const { resume, updateProjects } = useResumeBuilder();

  const addProject = () =>
    updateProjects([
      ...resume.projects,
      { ...newProject(), displayOrder: resume.projects.length },
    ]);

  const updateProject = (index: number, updated: Project) =>
    updateProjects(resume.projects.map((p, i) => (i === index ? updated : p)));

  const deleteProject = (index: number) =>
    updateProjects(resume.projects.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-text-primary font-semibold text-base">
            Projects
          </h2>
          <p className="text-text-muted text-sm">
            Highlight personal or professional projects. These are AI-tailorable
            — keep bullets results-focused.
          </p>
        </div>
        <button
          onClick={addProject}
          className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm px-3 py-2 rounded-md transition-colors shrink-0"
        >
          <Plus size={15} />
          Add Project
        </button>
      </div>

      {resume.projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg">
          <p className="text-text-muted text-sm">No projects added yet.</p>
          <button
            onClick={addProject}
            className="mt-3 text-accent hover:text-accent-hover text-sm transition-colors"
          >
            Add your first project
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {resume.projects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              onChange={(updated) => updateProject(i, updated)}
              onDelete={() => deleteProject(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
