import type { Resume, TemplateConfig } from "@resumeai/shared";

export interface BaseResumeOption {
  id: number;
  name: string;
}

export interface RawResume {
  id: number;
  name: string;
  summary: string;
  isDefault: number;
  isComplete: number;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  id: number;
  resumeId: number;
  jobTitle: string;
  companyName: string;
  tailoredData: Resume;
  createdAt: string;
}

export interface BaseResume {
  id: number;
  name: string;
  summary: string;
  isDefault: boolean;
  isComplete: boolean;
  variantCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SaveResumePayload = Resume & {
  resumeId: number;
  name: string;
  isDefault: boolean;
  templateConfig: TemplateConfig;
};

export interface ExportPayload {
  templateConfig: TemplateConfig;
  resumeId?: number;
  variantId?: number;
}
