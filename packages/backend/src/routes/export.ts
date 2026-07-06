import { Router } from "express";
import { pool } from "../db";
import { RowDataPacket } from "mysql2";
import { renderResumeToHtml, generatePdf } from "../services/pdfRenderer";
import { ResumeSchema } from "@resumeai/shared";
import { ZodError, ZodIssue } from "zod";

const router = Router();

router.post("/pdf", async (_req, res) => {
  const connection = await pool.getConnection();

  try {
    const [resumeRows] = await connection.query<RowDataPacket[]>(
      "SELECT id, summary FROM resumes LIMIT 1"
    );

    if (resumeRows.length === 0) {
      return res.status(404).json({ error: "No resume found" });
    }

    const resumeId = resumeRows[0].id;

    const [personalRows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM personal_info WHERE resume_id = ?",
      [resumeId]
    );
    const [categoryRows] = await connection.query<RowDataPacket[]>(
      "SELECT id, category, display_order FROM skill_categories WHERE resume_id = ? ORDER BY display_order",
      [resumeId]
    );
    const skills = await Promise.all(
      categoryRows.map(async (cat) => {
        const [skillRows] = await connection.query<RowDataPacket[]>(
          "SELECT skill FROM skills WHERE category_id = ? ORDER BY display_order",
          [cat.id]
        );
        return {
          id: String(cat.id),
          category: cat.category,
          items: skillRows.map((r) => r.skill),
          displayOrder: cat.display_order,
        };
      })
    );

    const [companyRows] = await connection.query<RowDataPacket[]>(
      "SELECT id, company_name, location, display_order FROM experience_companies WHERE resume_id = ? ORDER BY display_order",
      [resumeId]
    );
    const experience = await Promise.all(
      companyRows.map(async (company) => {
        const [roleRows] = await connection.query<RowDataPacket[]>(
          "SELECT id, title, employment_type, start_date, end_date, display_order FROM experience_roles WHERE company_id = ? ORDER BY display_order",
          [company.id]
        );
        const roles = await Promise.all(
          roleRows.map(async (role) => {
            const [bulletRows] = await connection.query<RowDataPacket[]>(
              "SELECT id, content, display_order FROM experience_bullets WHERE role_id = ? ORDER BY display_order",
              [role.id]
            );
            return {
              id: String(role.id),
              title: role.title,
              employmentType: role.employment_type,
              startDate: role.start_date,
              endDate: role.end_date,
              displayOrder: role.display_order,
              bullets: bulletRows.map((b) => ({
                id: String(b.id),
                content: b.content,
                displayOrder: b.display_order,
              })),
            };
          })
        );
        return {
          id: String(company.id),
          companyName: company.company_name,
          location: company.location,
          displayOrder: company.display_order,
          roles,
        };
      })
    );

    const [projectRows] = await connection.query<RowDataPacket[]>(
      "SELECT id, name, url, display_order FROM projects WHERE resume_id = ? ORDER BY display_order",
      [resumeId]
    );
    const projects = await Promise.all(
      projectRows.map(async (project) => {
        const [bulletRows] = await connection.query<RowDataPacket[]>(
          "SELECT id, content, display_order FROM project_bullets WHERE project_id = ? ORDER BY display_order",
          [project.id]
        );
        return {
          id: String(project.id),
          name: project.name,
          url: project.url || "",
          displayOrder: project.display_order,
          bullets: bulletRows.map((b) => ({
            id: String(b.id),
            content: b.content,
            displayOrder: b.display_order,
          })),
        };
      })
    );

    const [educationRows] = await connection.query<RowDataPacket[]>(
      "SELECT id, institution, degree, field, graduation_year, display_order FROM education WHERE resume_id = ? ORDER BY display_order",
      [resumeId]
    );
    const education = educationRows.map((e) => ({
      id: String(e.id),
      institution: e.institution,
      degree: e.degree,
      field: e.field,
      graduationYear: e.graduation_year,
      displayOrder: e.display_order,
    }));

    const personal = personalRows[0];
    const resumeData = {
      personal: {
        name: personal.name || "",
        title: personal.title || "",
        email: personal.email || "",
        phone: personal.phone || "",
        location: personal.location || "",
        linkedin: personal.linkedin || "",
        github: personal.github || "",
        portfolio: personal.portfolio || "",
      },
      summary: resumeRows[0].summary || "",
      skills,
      experience,
      projects,
      education,
    };

    const validated = ResumeSchema.safeParse(resumeData);
    if (!validated.success) {
      const zodError = validated.error as unknown as ZodError;
      const details = zodError.errors.map((e: ZodIssue) => e.message);
      return res.status(422).json({ error: "Resume is incomplete", details });
    }

    const html = renderResumeToHtml(validated.data);
    const pdf = await generatePdf(html);

    const name = personal.name ? personal.name.replace(/\s+/g, "_") : "resume";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${name}_resume.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    console.error("PDF export error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  } finally {
    connection.release();
  }
});

router.post("/pdf/variant/:id", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM resume_variants WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Variant not found" });
    const variant = rows[0];
    const resumeData =
      typeof variant.tailored_data === "string"
        ? JSON.parse(variant.tailored_data)
        : variant.tailored_data;
    const html = renderResumeToHtml(resumeData);
    const pdf = await generatePdf(html);
    const filename =
      [variant.company_name, variant.job_title]
        .filter(Boolean)
        .join("_")
        .replace(/\s+/g, "_") || "tailored_resume";
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: "Failed to export variant PDF" });
  } finally {
    connection.release();
  }
});

export default router;
