import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  PenLine,
} from "lucide-react";
import { useResumeBuilder } from "../../../context/ResumeBuilderContext";
import type {
  ExperienceCompany,
  ExperienceRole,
  ExperienceBullet,
} from "@resumeai/shared";

const uid = () => crypto.randomUUID();

const newBullet = (): ExperienceBullet => ({
  id: uid(),
  content: "",
  displayOrder: 0,
});

const newRole = (): ExperienceRole => ({
  id: uid(),
  title: "",
  employmentType: "full-time",
  startDate: "",
  endDate: "",
  bullets: [newBullet()],
  displayOrder: 0,
});

const newCompany = (): ExperienceCompany => ({
  id: uid(),
  companyName: "",
  location: "",
  roles: [newRole()],
  displayOrder: 0,
});

interface BulletRowProps {
  bullet: ExperienceBullet;
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
        placeholder="Describe an achievement or responsibility..."
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

interface RoleCardProps {
  role: ExperienceRole;
  onChange: (updated: ExperienceRole) => void;
  onDelete: () => void;
}

function RoleCard({ role, onChange, onDelete }: RoleCardProps) {
  const [expanded, setExpanded] = useState(true);

  const setField = (field: keyof ExperienceRole) => (value: string) =>
    onChange({ ...role, [field]: value });

  const updateBullet = (index: number, value: string) => {
    const updated = role.bullets.map((b, i) =>
      i === index ? { ...b, content: value } : b
    );
    onChange({ ...role, bullets: updated });
  };

  const addBullet = () =>
    onChange({
      ...role,
      bullets: [
        ...role.bullets,
        { ...newBullet(), displayOrder: role.bullets.length },
      ],
    });

  const deleteBullet = (index: number) =>
    onChange({ ...role, bullets: role.bullets.filter((_, i) => i !== index) });

  return (
    <div className="border border-border rounded-md bg-bg-base">
      <div className="flex items-center gap-2 px-4 py-3">
        <PenLine size={14} className="text-text-muted shrink-0" />
        <span className="flex-1 text-sm text-text-primary font-medium truncate">
          {role.title || "New Role"}
        </span>
        <button
          onClick={onDelete}
          className="text-text-muted hover:text-red-400 transition-colors"
        >
          <Trash2 size={14} />
        </button>
        <button
          onClick={() => setExpanded((p) => !p)}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-4 px-4 pb-4 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted">Role Title</label>
              <input
                type="text"
                value={role.title}
                onChange={(e) => setField("title")(e.target.value)}
                placeholder="Full Stack Developer"
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted">Employment Type</label>
              <select
                value={role.employmentType}
                onChange={(e) => setField("employmentType")(e.target.value)}
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              >
                <option value="full-time">Full-time</option>
                <option value="contract">Contract</option>
                <option value="part-time">Part-time</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted">Start Date</label>
              <input
                type="text"
                value={role.startDate}
                onChange={(e) => setField("startDate")(e.target.value)}
                placeholder="Jan 2023"
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted">End Date</label>
              <input
                type="text"
                value={role.endDate}
                onChange={(e) => setField("endDate")(e.target.value)}
                placeholder="Present"
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-text-muted">Bullets</label>
            {role.bullets.map((bullet, i) => (
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

interface CompanyCardProps {
  company: ExperienceCompany;
  onChange: (updated: ExperienceCompany) => void;
  onDelete: () => void;
}

function CompanyCard({ company, onChange, onDelete }: CompanyCardProps) {
  const [expanded, setExpanded] = useState(true);

  const setField = (field: keyof ExperienceCompany) => (value: string) =>
    onChange({ ...company, [field]: value });

  const updateRole = (index: number, updated: ExperienceRole) => {
    const roles = company.roles.map((r, i) => (i === index ? updated : r));
    onChange({ ...company, roles });
  };

  const addRole = () =>
    onChange({
      ...company,
      roles: [
        ...company.roles,
        { ...newRole(), displayOrder: company.roles.length },
      ],
    });

  const deleteRole = (index: number) =>
    onChange({
      ...company,
      roles: company.roles.filter((_, i) => i !== index),
    });

  return (
    <div className="border border-border rounded-lg bg-bg-surface">
      <div className="flex items-center gap-3 px-4 py-3">
        <GripVertical size={16} className="text-text-muted shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">
            {company.companyName || "New Company"}
          </p>
          <p className="text-xs text-text-muted truncate">{company.location}</p>
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
              <label className="text-xs text-text-muted">Company Name</label>
              <input
                type="text"
                value={company.companyName}
                onChange={(e) => setField("companyName")(e.target.value)}
                placeholder="Acme Inc."
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-text-muted">Location</label>
              <input
                type="text"
                value={company.location}
                onChange={(e) => setField("location")(e.target.value)}
                placeholder="Toronto, ON"
                className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-text-muted uppercase tracking-wide">
              Roles
            </label>
            {company.roles.map((role, i) => (
              <RoleCard
                key={role.id}
                role={role}
                onChange={(updated) => updateRole(i, updated)}
                onDelete={() => deleteRole(i)}
              />
            ))}
            <button
              onClick={addRole}
              className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors mt-1 w-fit"
            >
              <Plus size={13} />
              Add Role
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExperienceForm() {
  const { resume, updateExperience } = useResumeBuilder();

  const addCompany = () =>
    updateExperience([
      ...resume.experience,
      { ...newCompany(), displayOrder: resume.experience.length },
    ]);

  const updateCompany = (index: number, updated: ExperienceCompany) =>
    updateExperience(
      resume.experience.map((c, i) => (i === index ? updated : c))
    );

  const deleteCompany = (index: number) =>
    updateExperience(resume.experience.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-text-primary font-semibold text-base">
            Experience
          </h2>
          <p className="text-text-muted text-sm">
            Add your work history. Each company can have multiple roles to show
            progression.
          </p>
        </div>
        <button
          onClick={addCompany}
          className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm px-3 py-2 rounded-md transition-colors shrink-0"
        >
          <Plus size={15} />
          Add Company
        </button>
      </div>

      {resume.experience.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg">
          <p className="text-text-muted text-sm">No experience added yet.</p>
          <button
            onClick={addCompany}
            className="mt-3 text-accent hover:text-accent-hover text-sm transition-colors"
          >
            Add your first company
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {resume.experience.map((company, i) => (
            <CompanyCard
              key={company.id}
              company={company}
              onChange={(updated) => updateCompany(i, updated)}
              onDelete={() => deleteCompany(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
