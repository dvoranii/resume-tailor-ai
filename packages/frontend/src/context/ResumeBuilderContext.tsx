import { createContext, useContext, useState, useCallback } from "react";
import type { Resume, TemplateConfig } from "@resumeai/shared";
import {
  fetchResume,
  fetchResumeList,
  fetchVariantById,
  saveResumeApi,
  saveVariantApi,
  saveTemplateConfig,
  exportResumePdf,
} from "../services/resumes";
import { defaultTemplateConfig } from "@resumeai/shared";

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
  exportPdf: () => Promise<void>;
  templateConfig: TemplateConfig;
  updateTemplateConfig: (config: TemplateConfig) => void;
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
  const [resume, setResume] = useState<Resume>(defaultResume);
  const [isLoading, setIsLoading] = useState(true);
  const [currentResumeId, setCurrentResumeId] = useState<number | null>(null);
  const [resumeName, setResumeName] = useState<string>("My Resume");

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

  const loadResume = useCallback(
    async (id?: number | null) => {
      setIsLoading(true);
      try {
        if (id === null) {
          resetToEmpty();
          return;
        }

        const data = await fetchResume(id);
        if (data === null) {
          resetToEmpty();
          return;
        }

        setResume(data);
        setCurrentResumeId(id || null);

        setResumeName(data.name || "Untitled");
        if (data.templateConfig) {
          setTemplateConfig(data.templateConfig);
        } else {
          setTemplateConfig(defaultTemplateConfig);
        }

        const list = await fetchResumeList();
        if (id) {
          const found = list.find((r) => r.id === id);
          if (found) setResumeName(found.name);
        } else {
          const defaultOne = list.find((r) => r.isDefault === 1);
          if (defaultOne) setResumeName(defaultOne.name);
          else if (list.length > 0) setResumeName(list[0].name);
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

  const loadVariant = useCallback(
    async (variantId: number) => {
      setIsLoading(true);
      try {
        const data = await fetchVariantById(variantId);
        setResume(data.tailoredData);
        setCurrentVariantId(variantId);
        setIsVariant(true);
        setVariantJobTitle(data.jobTitle || "");
        setVariantCompany(data.companyName || "");
        setResumeName(`${data.jobTitle} at ${data.companyName} (Tailored)`);

        if ((data as any).templateConfig) {
          setTemplateConfig((data as any).templateConfig);
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
    },
    [resetToEmpty]
  );

  const saveResume = useCallback(
    async (latestResume: Resume) => {
      if (isVariant && currentVariantId) {
        try {
          await saveVariantApi(currentVariantId, latestResume, templateConfig);
        } catch (error) {
          console.error("Error saving variant:", error);
        }
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
          templateConfig,
        };
        await saveResumeApi(payload);
      } catch (error) {
        console.error("Error saving resume:", error);
      }
    },
    [currentResumeId, resumeName, isVariant, currentVariantId, templateConfig]
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

  const updateTemplateConfig = (config: TemplateConfig) => {
    setTemplateConfig(config);
    if (configSaveTimeout) clearTimeout(configSaveTimeout);
    const timeout = window.setTimeout(() => {
      const target =
        isVariant && currentVariantId
          ? { type: "variant" as const, id: currentVariantId }
          : currentResumeId
          ? { type: "resume" as const, id: currentResumeId }
          : null;
      if (target) saveTemplateConfig(target, config);
    }, 800);
    setConfigSaveTimeout(timeout);
  };

  const exportPdf = async () => {
    const payload: {
      templateConfig: TemplateConfig;
      resumeId?: number;
      variantId?: number;
    } = { templateConfig };
    if (currentResumeId) payload.resumeId = currentResumeId;
    if (currentVariantId) payload.variantId = currentVariantId;

    const blob = await exportResumePdf(payload);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

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
        exportPdf,
        templateConfig,
        updateTemplateConfig,
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
