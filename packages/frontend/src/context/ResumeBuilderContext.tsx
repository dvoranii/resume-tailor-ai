import { createContext, useContext, useState, useCallback } from "react";
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
  isVariant: boolean;
  variantJobTitle: string;
  variantCompany: string;
  baseResumeIdForVariant: number | null;
  updatePersonal: (data: Resume["personal"]) => void;
  updateSummary: (summary: string) => void;
  updateSkills: (skills: Resume["skills"]) => void;
  updateExperience: (experience: Resume["experience"]) => void;
  updateProjects: (projects: Resume["projects"]) => void;
  updateEducation: (education: Resume["education"]) => void;
  saveResume: (resume: Resume) => Promise<void>;
  loadResume: (id?: number | null) => Promise<void>;
  loadVariant: (variantId: number) => Promise<void>;
  // saveAsNew: (name: string, isDefault: boolean) => Promise<number>;
  exportPdf: () => Promise<void>;
  templateConfig: TemplateConfig;
  updateTemplateConfig: (config: TemplateConfig) => void;
  // saveTemplateConfig is no longer used (replaced by per‑entity save)
  currentResumeId: number | null;
  currentVariantId: number | null;
}

const ResumeBuilderContext = createContext<ResumeBuilderContextType | null>(
  null
);

export function ResumeBuilderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // base resume
  const [resume, setResume] = useState<Resume>(defaultResume);
  const [isLoading, setIsLoading] = useState(true);
  const [currentResumeId, setCurrentResumeId] = useState<number | null>(null);
  const [resumeName, setResumeName] = useState<string>("My Resume");

  // variants
  const [currentVariantId, setCurrentVariantId] = useState<number | null>(null);
  const [isVariant, setIsVariant] = useState(false);
  const [variantJobTitle, setVariantJobTitle] = useState("");
  const [variantCompany, setVariantCompany] = useState("");
  const [baseResumeIdForVariant, setBaseResumeIdForVariant] = useState<
    number | null
  >(null);

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
    setCurrentVariantId(null);
    setIsVariant(false);
    setVariantJobTitle("");
    setVariantCompany("");
    setBaseResumeIdForVariant(null);
  }, []);

  // Fetch base resume data
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

        // ✅ Set template config from response
        if (data.templateConfig) {
          setTemplateConfig(data.templateConfig);
        } else {
          setTemplateConfig(defaultTemplateConfig);
        }

        // Fetch name from list (to get display name)
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

  // Load variant
  const loadVariant = useCallback(async (variantId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/resume/variants/${variantId}`);
      if (!response.ok) throw new Error("Failed to fetch variant");
      const data = await response.json();
      setResume(data.tailoredData);
      setCurrentVariantId(variantId);
      setIsVariant(true);
      setVariantJobTitle(data.jobTitle || "");
      setVariantCompany(data.companyName || "");
      setResumeName(`${data.jobTitle} at ${data.companyName} (Tailored)`);
      // ✅ Set template config from variant
      if (data.templateConfig) {
        setTemplateConfig(data.templateConfig);
      } else {
        setTemplateConfig(defaultTemplateConfig);
      }
      setCurrentResumeId(null);
      setBaseResumeIdForVariant(data.resumeId || null);
    } catch (error) {
      console.error("Error loading variant:", error);
      resetToEmpty();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save variant (content only)
  const saveVariant = useCallback(
    async (variantId: number, data: Resume) => {
      try {
        const response = await fetch(
          `${API_BASE}/resume/variants/${variantId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tailoredData: data,
              templateConfig: templateConfig, // ✅ also send current template config
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to save variant");
      } catch (error) {
        console.error("Error saving variant:", error);
      }
    },
    [templateConfig]
  );

  // Save base resume (content only)
  const saveResume = useCallback(
    async (latestResume: Resume) => {
      if (isVariant && currentVariantId) {
        await saveVariant(currentVariantId, latestResume);
        return;
      }
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
          templateConfig: templateConfig, // ✅ include template config
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
    },
    [
      currentResumeId,
      resumeName,
      isVariant,
      currentVariantId,
      saveVariant,
      templateConfig,
    ]
  );

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

  // ============================================================
  // Template Config Persistence (per resume / variant)
  // ============================================================

  // Save template config to the current entity (base or variant)
  const saveTemplateConfigToCurrentEntity = useCallback(
    async (config: TemplateConfig) => {
      if (isVariant && currentVariantId) {
        await fetch(
          `${API_BASE}/resume/variants/${currentVariantId}/template`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateConfig: config }),
          }
        );
      } else if (currentResumeId) {
        await fetch(`${API_BASE}/resume/${currentResumeId}/template`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateConfig: config }),
        });
      }
    },
    [isVariant, currentVariantId, currentResumeId]
  );

  // Update template config (called from UI) – saves locally and persists
  const updateTemplateConfig = (config: TemplateConfig) => {
    setTemplateConfig(config);
    // Debounce save to avoid too many requests
    if (configSaveTimeout) clearTimeout(configSaveTimeout);
    const timeout = window.setTimeout(() => {
      saveTemplateConfigToCurrentEntity(config);
    }, 800);
    setConfigSaveTimeout(timeout);
  };

  // Export PDF
  const exportPdf = async () => {
    const payload: any = { templateConfig };
    if (currentResumeId) {
      payload.resumeId = currentResumeId;
    }
    if (currentVariantId) {
      payload.variantId = currentVariantId;
    }

    const response = await fetch(`${API_BASE}/export/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

  // The old global save functions are no longer used – kept for reference (commented out)
  /*
  const saveTemplateConfigToServer = async (latestConfig: TemplateConfig) => {
    // deprecated
  };
  const debouncedSaveTemplateConfig = (latestConfig: TemplateConfig) => {
    // deprecated
  };
  const saveTemplateConfig = async () => {
    // deprecated
  };
  */

  return (
    <ResumeBuilderContext.Provider
      value={{
        resume,
        isLoading,
        resumeName,
        isVariant,
        variantJobTitle,
        variantCompany,
        baseResumeIdForVariant,
        updatePersonal,
        updateSummary,
        updateSkills,
        updateExperience,
        updateProjects,
        updateEducation,
        saveResume,
        loadResume,
        loadVariant,
        // saveAsNew,
        exportPdf,
        templateConfig,
        updateTemplateConfig,
        // saveTemplateConfig, // removed – no longer used
        currentResumeId,
        currentVariantId,
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
