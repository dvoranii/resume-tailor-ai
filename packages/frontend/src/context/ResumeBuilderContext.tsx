import { createContext, useContext, useState, useEffect } from "react";
import type { Resume } from "@resumeai/shared";

const API_BASE = "http://localhost:3001/api/v1";

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
  saveResume: () => Promise<void>;
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

  // Load resume on mount
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

  // Save resume to backend
  const saveResume = async () => {
    try {
      const response = await fetch(`${API_BASE}/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resume),
      });
      if (!response.ok) {
        console.error("Failed to save resume:", response.status);
      }
    } catch (error) {
      console.error("Error saving resume:", error);
    }
  };

  // Auto-save with debounce using browser timeout
  const debouncedSave = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    const timeout = window.setTimeout(() => {
      saveResume();
    }, 800);
    setSaveTimeout(timeout);
  };

  // Update functions with auto-save
  const updatePersonal = (data: Resume["personal"]) => {
    setResume((prev) => ({ ...prev, personal: data }));
    debouncedSave();
  };

  const updateSummary = (summary: string) => {
    setResume((prev) => ({ ...prev, summary }));
    debouncedSave();
  };

  const updateSkills = (skills: Resume["skills"]) => {
    setResume((prev) => ({ ...prev, skills }));
    debouncedSave();
  };

  const updateExperience = (experience: Resume["experience"]) => {
    setResume((prev) => ({ ...prev, experience }));
    debouncedSave();
  };

  const updateProjects = (projects: Resume["projects"]) => {
    setResume((prev) => ({ ...prev, projects }));
    debouncedSave();
  };

  const updateEducation = (education: Resume["education"]) => {
    setResume((prev) => ({ ...prev, education }));
    debouncedSave();
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
