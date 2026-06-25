import { useResumeBuilder } from "../../../context/ResumeBuilderContext";
import type { PersonalInfo } from "@resumeai/shared";

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

function Field({ label, value, onChange, placeholder, required }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-text-muted">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-bg-input border border-border rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
      />
    </div>
  );
}

export default function PersonalInfoForm() {
  const { resume, updatePersonal } = useResumeBuilder();
  const personal = resume.personal;

  const set = (field: keyof PersonalInfo) => (value: string) => {
    updatePersonal({ ...personal, [field]: value });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-text-primary font-semibold text-base">
          Personal Information
        </h2>
        <p className="text-text-muted text-sm">
          This information appears at the top of your resume.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Full Name"
          value={personal.name}
          onChange={set("name")}
          placeholder="Adrian Dvorani"
          required
        />
        <Field
          label="Job Title"
          value={personal.title}
          onChange={set("title")}
          placeholder="Full Stack Developer"
          required
        />
        <Field
          label="Email"
          value={personal.email}
          onChange={set("email")}
          placeholder="adrian@email.com"
          required
        />
        <Field
          label="Phone"
          value={personal.phone}
          onChange={set("phone")}
          placeholder="(555) 123-4567"
          required
        />
        <Field
          label="Location"
          value={personal.location}
          onChange={set("location")}
          placeholder="Toronto, ON"
          required
        />
        <Field
          label="LinkedIn"
          value={personal.linkedin ?? ""}
          onChange={set("linkedin")}
          placeholder="linkedin.com/in/yourname"
        />
        <Field
          label="Portfolio / Website"
          value={personal.portfolio ?? ""}
          onChange={set("portfolio")}
          placeholder="yoursite.dev"
        />
        <Field
          label="GitHub"
          value={personal.github ?? ""}
          onChange={set("github")}
          placeholder="github.com/yourname"
        />
      </div>
    </div>
  );
}
