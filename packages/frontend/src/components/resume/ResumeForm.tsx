import { useState } from "react";
import PersonalInfoForm from "./forms/PersonalInfoForm";
import SummaryForm from "./forms/SummaryForm";
import ExperienceForm from "./forms/ExperienceForm";
import EducationForm from "./forms/EducationForm";
import SkillsForm from "./forms/SkillsForm";
import ProjectsForm from "./forms/ProjectsForm";
import TailorForm from "./forms/TailorForm";

const baseTabs = [
  { id: "personal", label: "Personal Info" },
  { id: "summary", label: "Summary" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
] as const;

type TabId = (typeof baseTabs)[number]["id"] | "tailor";

export default function ResumeForm({
  isVariant = false,
  resumeId,
}: {
  isVariant?: boolean;
  resumeId?: number;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("personal");

  const tabs = isVariant
    ? baseTabs
    : [...baseTabs, { id: "tailor", label: "✦ Tailor" } as const];

  const renderTab = () => {
    switch (activeTab) {
      case "personal":
        return <PersonalInfoForm />;
      case "summary":
        return <SummaryForm />;
      case "experience":
        return <ExperienceForm />;
      case "education":
        return <EducationForm />;
      case "skills":
        return <SkillsForm />;
      case "projects":
        return <ProjectsForm />;
      case "tailor":
        if (isVariant) return null;
        return <TailorForm resumeId={resumeId} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col flex-1 min-w-0 bg-bg-surface rounded-lg border border-border overflow-hidden">
      <div className="flex border-b border-border overflow-x-auto shrink-0 justify-evenly">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">{renderTab()}</div>
    </div>
  );
}
