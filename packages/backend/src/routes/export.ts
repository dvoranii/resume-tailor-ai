import { Router } from "express";
import { pool } from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { renderResumeToHtml, generatePdf } from "../services/pdfRenderer";
import { ResumeSchema, defaultTemplateConfig } from "@resumeai/shared";
import { ZodError, ZodIssue } from "zod";

const router = Router();

async function saveExportRecord(
  resumeId: number | null,
  variantId: number | null,
  jobTitle: string | null,
  companyName: string | null,
  fileName: string
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO exports (user_id, resume_id, variant_id, job_title, company_name, file_name)
     VALUES (1, ?, ?, ?, ?, ?)`,
    [resumeId, variantId, jobTitle, companyName, fileName]
  );
  return result.insertId;
}

async function fetchFullResumeById(resumeId: number) {
  const connection = await pool.getConnection();
  try {
    const [resumeRows] = await connection.query<RowDataPacket[]>(
      "SELECT id, summary FROM resumes WHERE id = ?",
      [resumeId]
    );
    if (resumeRows.length === 0) return null;

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
    return {
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
  } finally {
    connection.release();
  }
}

router.post("/pdf", async (req, res) => {
  const { templateConfig, resumeId, variantId } = req.body;

  let resumeData = null;
  let actualResumeId: number | null = null;
  let actualVariantId: number | null = null;
  let jobTitle: string | null = null;
  let companyName: string | null = null;

  if (variantId) {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT resume_id, job_title, company_name, tailored_data FROM resume_variants WHERE id = ?",
        [variantId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "Variant not found" });
      }
      const variant = rows[0];
      actualResumeId = variant.resume_id;
      actualVariantId = Number(variantId);
      jobTitle = variant.job_title;
      companyName = variant.company_name;
      resumeData =
        typeof variant.tailored_data === "string"
          ? JSON.parse(variant.tailored_data)
          : variant.tailored_data;
    } finally {
      connection.release();
    }
  } else if (resumeId) {
    resumeData = await fetchFullResumeById(Number(resumeId));
    if (!resumeData) {
      return res.status(404).json({ error: "Resume not found" });
    }
    actualResumeId = Number(resumeId);
  } else {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT id FROM resumes LIMIT 1"
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "No resume found" });
      }
      resumeData = await fetchFullResumeById(rows[0].id);
      if (!resumeData) {
        return res.status(404).json({ error: "Resume data not found" });
      }
      actualResumeId = rows[0].id;
    } finally {
      connection.release();
    }
  }

  const validated = ResumeSchema.safeParse(resumeData);
  if (!validated.success) {
    const zodError = validated.error as unknown as ZodError;
    const details = zodError.errors.map((e: ZodIssue) => e.message);
    return res.status(422).json({ error: "Resume is incomplete", details });
  }

  const html = renderResumeToHtml(validated.data, templateConfig);
  const pdf = await generatePdf(html);

  const fileName = `resume_${Date.now()}.pdf`;
  const exportId = await saveExportRecord(
    actualResumeId,
    actualVariantId,
    jobTitle,
    companyName,
    fileName
  );

  const name = resumeData.personal?.name?.replace(/\s+/g, "_") || "resume";
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${name}_resume.pdf"`
  );
  res.send(pdf);
});

router.post("/pdf/variant/:id", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT resume_id, job_title, company_name, tailored_data FROM resume_variants WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Variant not found" });
    }

    const variant = rows[0];
    const resumeData =
      typeof variant.tailored_data === "string"
        ? JSON.parse(variant.tailored_data)
        : variant.tailored_data;

    const validated = ResumeSchema.safeParse(resumeData);
    if (!validated.success) {
      const zodError = validated.error as unknown as ZodError;
      const details = zodError.errors.map((e: ZodIssue) => e.message);
      return res
        .status(422)
        .json({ error: "Variant resume data is invalid", details });
    }

    const html = renderResumeToHtml(
      validated.data,
      req.body.templateConfig || {}
    );
    const pdf = await generatePdf(html);

    const fileName = `tailored_${Date.now()}.pdf`;
    await saveExportRecord(
      variant.resume_id,
      Number(req.params.id),
      variant.job_title,
      variant.company_name,
      fileName
    );

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
    console.error("Variant export error:", error);
    res.status(500).json({ error: "Failed to export variant PDF" });
  } finally {
    connection.release();
  }
});

router.get("/exports", async (req, res) => {
  const { search } = req.query;
  let query = `
    SELECT id, resume_id, variant_id, job_title, company_name, file_name, created_at
    FROM exports
    WHERE user_id = 1
  `;
  const params: any[] = [];

  if (search && typeof search === "string" && search.trim()) {
    const like = `%${search.trim()}%`;
    query += ` AND (job_title LIKE ? OR company_name LIKE ?)`;
    params.push(like, like);
  }

  query += ` ORDER BY created_at DESC`;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching exports:", error);
    res.status(500).json({ error: "Failed to fetch exports" });
  }
});

router.get("/exports/:id/download", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT resume_id, variant_id, file_name FROM exports WHERE id = ? AND user_id = 1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Export not found" });
    }
    const exportRecord = rows[0];

    let pdfBuffer: Buffer;
    let filename: string;

    if (exportRecord.variant_id) {
      const [variantRows] = await pool.query<RowDataPacket[]>(
        "SELECT job_title, company_name, tailored_data FROM resume_variants WHERE id = ?",
        [exportRecord.variant_id]
      );
      if (variantRows.length === 0) {
        return res.status(404).json({ error: "Variant not found" });
      }
      const variant = variantRows[0];
      const resumeData =
        typeof variant.tailored_data === "string"
          ? JSON.parse(variant.tailored_data)
          : variant.tailored_data;
      const validated = ResumeSchema.safeParse(resumeData);
      if (!validated.success) {
        return res.status(422).json({ error: "Variant data is invalid" });
      }
      const html = renderResumeToHtml(validated.data, defaultTemplateConfig);
      pdfBuffer = await generatePdf(html);
      filename =
        [variant.company_name, variant.job_title]
          .filter(Boolean)
          .join("_")
          .replace(/\s+/g, "_") || "tailored_resume";
    } else if (exportRecord.resume_id) {
      const resumeData = await fetchFullResumeById(exportRecord.resume_id);
      if (!resumeData) {
        return res.status(404).json({ error: "Resume not found" });
      }
      const validated = ResumeSchema.safeParse(resumeData);
      if (!validated.success) {
        return res.status(422).json({ error: "Resume data is invalid" });
      }
      const html = renderResumeToHtml(validated.data, defaultTemplateConfig);
      pdfBuffer = await generatePdf(html);
      filename = resumeData.personal?.name?.replace(/\s+/g, "_") || "resume";
    } else {
      return res.status(400).json({ error: "Invalid export record" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to download export" });
  }
});

export default router;
