import { z } from "zod";

export const PersonalInfoSchema = z.object({
  name: z.string().default(""),
  title: z.string().default(""),
  email: z.string().email("Invalid email").default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  linkedin: z.string().optional().default(""),
  github: z.string().optional().default(""),
  portfolio: z.string().optional().default(""),
});

export const SkillCategorySchema = z.object({
  id: z.string().default(""),
  category: z.string().default(""),
  items: z.array(z.string()).default([]),
  displayOrder: z.number().int().default(0),
});

export const ExperienceBulletSchema = z.object({
  id: z.string().default(""),
  content: z.string().default(""),
  displayOrder: z.number().int().default(0),
});

export const ExperienceRoleSchema = z.object({
  id: z.string().default(""),
  title: z.string().default(""),
  employmentType: z
    .enum(["full-time", "contract", "part-time"])
    .default("full-time"),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  bullets: z.array(ExperienceBulletSchema).default([]),
  displayOrder: z.number().int().default(0),
});

export const ExperienceCompanySchema = z.object({
  id: z.string().default(""),
  companyName: z.string().default(""),
  location: z.string().default(""),
  roles: z.array(ExperienceRoleSchema).default([]),
  displayOrder: z.number().int().default(0),
});

export const ProjectBulletSchema = z.object({
  id: z.string().default(""),
  content: z.string().default(""),
  displayOrder: z.number().int().default(0),
});

export const ProjectSchema = z.object({
  id: z.string().default(""),
  name: z.string().default(""),
  url: z.string().optional().default(""),
  bullets: z.array(ProjectBulletSchema).default([]),
  displayOrder: z.number().int().default(0),
});

export const EducationSchema = z.object({
  id: z.string().default(""),
  institution: z.string().default(""),
  degree: z.string().default(""),
  field: z.string().default(""),
  graduationYear: z.string().default(""),
  displayOrder: z.number().int().default(0),
});

export const ResumeSchema = z.object({
  personal: PersonalInfoSchema.default({
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  }),
  summary: z.string().default(""),
  skills: z.array(SkillCategorySchema).default([]),
  experience: z.array(ExperienceCompanySchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  education: z.array(EducationSchema).default([]),
});

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type ExperienceBullet = z.infer<typeof ExperienceBulletSchema>;
export type ExperienceRole = z.infer<typeof ExperienceRoleSchema>;
export type ExperienceCompany = z.infer<typeof ExperienceCompanySchema>;
export type ProjectBullet = z.infer<typeof ProjectBulletSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type Resume = z.infer<typeof ResumeSchema>;

export const TailoredResumeSchema = z.object({
  summary: z.string().optional(),
  skills: z.array(SkillCategorySchema).optional(),
  experience: z.array(ExperienceCompanySchema).optional(),
  projects: z.array(ProjectSchema).optional(),
});

export type TailoredResume = z.infer<typeof TailoredResumeSchema>;
