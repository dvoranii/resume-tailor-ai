import {
  createContext,
  useContext,
  useState,
  // useEffect,
  useCallback,
} from "react";
import type { Resume, TemplateConfig } from "@resumeai/shared";
import { API_BASE } from "../types/jobs";

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
  resumeName: string;
  updatePersonal: (data: Resume["personal"]) => void;
  updateSummary: (summary: string) => void;
  updateSkills: (skills: Resume["skills"]) => void;
  updateExperience: (experience: Resume["experience"]) => void;
  updateProjects: (projects: Resume["projects"]) => void;
  updateEducation: (education: Resume["education"]) => void;
  saveResume: (resume: Resume) => Promise<void>;
  loadResume: (id?: number | null) => Promise<void>;
  saveAsNew: (name: string, isDefault: boolean) => Promise<number>;
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
  const [currentResumeId, setCurrentResumeId] = useState<number | null>(null);
  const [resumeName, setResumeName] = useState<string>("My Resume");
  const [saveTimeout, setSaveTimeout] = useState<number | null>(null);
  const [configSaveTimeout, setConfigSaveTimeout] = useState<number | null>(
    null
  );
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>(
    defaultTemplateConfig
  );

  const resetToEmpty = useCallback(() => {
    setResume(defaultResume);
    setCurrentResumeId(null);
    setResumeName("Untitled");
  }, []);

  const fetchResumeData = useCallback(
    async (id?: number | null) => {
      setIsLoading(true);
      try {
        if (id === null) {
          resetToEmpty();
          return;
        }
        let url = `${API_BASE}/resume`;

        if (id) {
          url += `?id=${id}`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            resetToEmpty();
            return;
          }
          throw new Error(`Failed to fetch resume: ${response.status}`);
        }

        const data = await response.json();
        setResume(data);
        setCurrentResumeId(id || null);
        setResumeName(data.name || "Untitled");

        // Fetch name from list
        const listRes = await fetch(`${API_BASE}/resumes/list`);
        if (listRes.ok) {
          const list = await listRes.json();
          if (id) {
            const found = list.find((r: any) => r.id === id);
            if (found) setResumeName(found.name);
          } else {
            const defaultOne = list.find((r: any) => r.isDefault === true);
            if (defaultOne) setResumeName(defaultOne.name);
            else if (list.length > 0) setResumeName(list[0].name);
          }
        }
      } catch (error) {
        console.error("Error loading resume:", error);
        resetToEmpty();
      } finally {
        setIsLoading(false);
      }
    },
    [resetToEmpty]
  );

  const loadResume = useCallback(
    async (id?: number | null) => {
      await fetchResumeData(id);
    },
    [fetchResumeData]
  );

  const saveAsNew = useCallback(
    async (name: string, isDefault: boolean): Promise<number> => {
      try {
        const payload = {
          ...resume,
          name,
          isDefault,
        };
        const response = await fetch(`${API_BASE}/resume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to save as new");
        }
        const data = await response.json();
        return data.id;
      } catch (error) {
        console.error("Error saving as new:", error);
        alert("Failed to save as new resume.");
        throw error;
      }
    },
    [resume]
  );

  const saveResume = async (latestResume: Resume) => {
    if (currentResumeId === null) {
      console.warn("Cannot save without a resume ID – use saveAsNew instead");
      return;
    }

    try {
      const payload = {
        ...latestResume,
        resumeId: currentResumeId,
        name: resumeName,
        isDefault: false,
      };

      const response = await fetch(`${API_BASE}/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const updateField = <K extends keyof Resume>(field: K, value: Resume[K]) => {
    const updated = { ...resume, [field]: value };
    setResume(updated);
    debouncedSave(updated);
  };

  const updatePersonal = (data: Resume["personal"]) =>
    updateField("personal", data);
  const updateSummary = (summary: string) => updateField("summary", summary);
  const updateSkills = (skills: Resume["skills"]) =>
    updateField("skills", skills);
  const updateExperience = (experience: Resume["experience"]) =>
    updateField("experience", experience);
  const updateProjects = (projects: Resume["projects"]) =>
    updateField("projects", projects);
  const updateEducation = (education: Resume["education"]) =>
    updateField("education", education);

  const exportPdf = async () => {
    const response = await fetch(`${API_BASE}/export/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateConfig }),
    });
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
        resumeName,
        updatePersonal,
        updateSummary,
        updateSkills,
        updateExperience,
        updateProjects,
        updateEducation,
        saveResume,
        loadResume,
        saveAsNew,
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
