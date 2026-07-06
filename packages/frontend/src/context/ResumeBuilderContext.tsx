import { createContext, useContext, useState, useEffect } from "react";
import type { Resume, TemplateConfig } from "@resumeai/shared";

const API_BASE = "http://localhost:3001/api/v1";

// Define the config directly in the frontend
const defaultTemplateConfig: TemplateConfig = {
  sectionOrder: ["summary", "experience", "education", "skills", "projects"],
  sectionTitleColor: "#1155cc",
  nameAlignment: "left",
  titleAlignment: "left",
  summaryAlignment: "left",
  experienceOrder: [],
  educationOrder: [],
  projectsOrder: [],
  contactAlignment: "left",
};

const defaultResume: Resume = {
  personal: {
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  },
  summary: "",
  skills: [],
  experience: [],
  projects: [],
  education: [],
};

interface ResumeBuilderContextType {
  resume: Resume;
  isLoading: boolean;
  updatePersonal: (data: Resume["personal"]) => void;
  updateSummary: (summary: string) => void;
  updateSkills: (skills: Resume["skills"]) => void;
  updateExperience: (experience: Resume["experience"]) => void;
  updateProjects: (projects: Resume["projects"]) => void;
  updateEducation: (education: Resume["education"]) => void;
  saveResume: (resume: Resume) => Promise<void>;
  exportPdf: () => Promise<void>;
  templateConfig: TemplateConfig;
  updateTemplateConfig: (config: TemplateConfig) => void;
  saveTemplateConfig: () => Promise<void>;
}

const ResumeBuilderContext = createContext<ResumeBuilderContextType | null>(
  null
);

export function ResumeBuilderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [resume, setResume] = useState<Resume>(defaultResume);
  const [isLoading, setIsLoading] = useState(true);
  const [saveTimeout, setSaveTimeout] = useState<number | null>(null);
  const [configSaveTimeout, setConfigSaveTimeout] = useState<number | null>(
    null
  );
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>(
    defaultTemplateConfig
  );

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const response = await fetch(`${API_BASE}/resume`);
        if (response.ok) {
          const data = await response.json();
          setResume(data);
        } else {
          console.error("Failed to fetch resume:", response.status);
        }
      } catch (error) {
        console.error("Error fetching resume:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResume();
  }, []);

  useEffect(() => {
    const fetchTemplateConfig = async () => {
      try {
        const response = await fetch(`${API_BASE}/template-config`);
        if (response.ok) {
          const data = await response.json();
          setTemplateConfig(data);
        }
      } catch (error) {
        console.error("Error fetching template config:", error);
      }
    };
    fetchTemplateConfig();
  }, []);

  const saveResume = async (latestResume: Resume) => {
    try {
      const response = await fetch(`${API_BASE}/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latestResume),
      });
      if (!response.ok) {
        console.error("Failed to save resume:", response.status);
      }
    } catch (error) {
      console.error("Error saving resume:", error);
    }
  };

  const debouncedSave = (latestResume: Resume) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    const timeout = window.setTimeout(() => {
      saveResume(latestResume);
    }, 800);
    setSaveTimeout(timeout);
  };

  const updatePersonal = (data: Resume["personal"]) => {
    const updated = { ...resume, personal: data };
    setResume(updated);
    debouncedSave(updated);
  };

  const updateSummary = (summary: string) => {
    const updated = { ...resume, summary };
    setResume(updated);
    debouncedSave(updated);
  };

  const updateSkills = (skills: Resume["skills"]) => {
    const updated = { ...resume, skills };
    setResume(updated);
    debouncedSave(updated);
  };

  const updateExperience = (experience: Resume["experience"]) => {
    const updated = { ...resume, experience };
    setResume(updated);
    debouncedSave(updated);
  };

  const updateProjects = (projects: Resume["projects"]) => {
    const updated = { ...resume, projects };
    setResume(updated);
    debouncedSave(updated);
  };

  const updateEducation = (education: Resume["education"]) => {
    const updated = { ...resume, education };
    setResume(updated);
    debouncedSave(updated);
  };

  const exportPdf = async () => {
    const response = await fetch(`${API_BASE}/export/pdf`, { method: "POST" });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Export failed");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };
  const saveTemplateConfigToServer = async (latestConfig: TemplateConfig) => {
    try {
      const response = await fetch(`${API_BASE}/template-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latestConfig),
      });
      if (!response.ok) {
        console.error("Failed to save template config:", response.status);
      }
    } catch (error) {
      console.error("Error saving template config:", error);
    }
  };

  const debouncedSaveTemplateConfig = (latestConfig: TemplateConfig) => {
    if (configSaveTimeout) clearTimeout(configSaveTimeout);
    const timeout = window.setTimeout(() => {
      saveTemplateConfigToServer(latestConfig);
    }, 800);
    setConfigSaveTimeout(timeout);
  };

  const updateTemplateConfig = (config: TemplateConfig) => {
    setTemplateConfig(config);
    debouncedSaveTemplateConfig(config);
  };

  const saveTemplateConfig = async () => {
    await saveTemplateConfigToServer(templateConfig);
  };

  return (
    <ResumeBuilderContext.Provider
      value={{
        resume,
        isLoading,
        updatePersonal,
        updateSummary,
        updateSkills,
        updateExperience,
        updateProjects,
        updateEducation,
        saveResume,
        exportPdf,
        templateConfig,
        updateTemplateConfig,
        saveTemplateConfig,
      }}
    >
      {children}
    </ResumeBuilderContext.Provider>
  );
}

export function useResumeBuilder() {
  const context = useContext(ResumeBuilderContext);
  if (!context) {
    throw new Error(
      "useResumeBuilder must be used within a ResumeBuilderProvider"
    );
  }
  return context;
}
