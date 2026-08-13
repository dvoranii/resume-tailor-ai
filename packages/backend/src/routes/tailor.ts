import { Router } from "express";
import { pool } from "../db";
import { ResumeSchema } from "@resumeai/shared";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ZodError, ZodIssue } from "zod";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchMasterResume(
  connection: Awaited<ReturnType<typeof pool.getConnection>>
) {
  const [resumeRows] = await connection.query<RowDataPacket[]>(
    "SELECT id, summary FROM resumes LIMIT 1"
  );
  if (resumeRows.length === 0) return null;

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
  return {
    resumeId,
    resume: {
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
    },
  };
}

router.post("/", async (req, res) => {
  const { jobDescription, jobTitle, companyName, jobId } = req.body;

  if (!jobDescription?.trim()) {
    return res.status(400).json({ error: "Job description is required" });
  }

  const connection = await pool.getConnection();

  try {
    const master = await fetchMasterResume(connection);
    if (!master) {
      return res.status(404).json({ error: "No master resume found" });
    }

    const { resumeId, resume } = master;

    const systemPrompt = `You are a professional resume writer. You will be given a resume in JSON format and a job description. Your task is to tailor the resume for the job by rewriting specific text fields only.

Rules you must follow:
- Return only a valid JSON object. No markdown, no backticks, no explanation.
- Only modify these fields: summary, experience[].roles[].bullets[].content, skills[].items (reordering only, do not add or remove skills), projects[].bullets[].content
- Do not change any structural fields: ids, displayOrder, dates, titles, company names, employment types, urls, institution names, degrees
- Do not add or remove any array items. The number of companies, roles, bullets, skills categories, skill items, and projects must remain identical.
- Rewrite bullet points to emphasize achievements and keywords relevant to the job description
- Reorder skill items within each category to front-load the most relevant ones
- Keep all rewrites truthful to the original content — do not invent experience or skills
- Return the full resume JSON with your changes applied`;

    const userPrompt = `Resume JSON:
${JSON.stringify(resume, null, 2)}

Job Description:
${jobDescription}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    const rawContent = completion.choices[0].message.content ?? "";

    let tailoredResume;
    try {
      tailoredResume = JSON.parse(rawContent);
    } catch {
      return res
        .status(500)
        .json({ error: "AI returned invalid JSON", raw: rawContent });
    }

    const validated = ResumeSchema.safeParse(tailoredResume);
    if (!validated.success) {
      const zodError = validated.error as unknown as ZodError;
      const details = zodError.errors.map((e: ZodIssue) => e.message);
      return res
        .status(422)
        .json({ error: "AI response did not match resume schema", details });
    }

    // ✅ Check if a variant already exists for this resume + job
    let variantId: number;

    if (jobId) {
      const [existing] = await connection.query<RowDataPacket[]>(
        `SELECT id FROM resume_variants WHERE resume_id = ? AND job_id = ?`,
        [resumeId, jobId]
      );

      if (existing.length > 0) {
        // ✅ Update existing variant
        await connection.query(
          `UPDATE resume_variants SET tailored_data = ? WHERE id = ?`,
          [JSON.stringify(validated.data), existing[0].id]
        );
        variantId = existing[0].id;
      } else {
        // ✅ Insert new variant with job_id
        const [result] = await connection.query<ResultSetHeader>(
          `INSERT INTO resume_variants 
            (resume_id, job_id, job_title, company_name, job_description, tailored_data)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            resumeId,
            jobId,
            jobTitle || "",
            companyName || "",
            jobDescription,
            JSON.stringify(validated.data),
          ]
        );
        variantId = result.insertId;
      }
    } else {
      // ✅ No jobId provided – insert as standalone variant (job_id = NULL)
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO resume_variants 
          (resume_id, job_title, company_name, job_description, tailored_data)
         VALUES (?, ?, ?, ?, ?)`,
        [
          resumeId,
          jobTitle || "",
          companyName || "",
          jobDescription,
          JSON.stringify(validated.data),
        ]
      );
      variantId = result.insertId;
    }

    // ✅ Update the job's variant_id (if jobId is provided)
    if (jobId) {
      await connection.query(`UPDATE jobs SET variant_id = ? WHERE id = ?`, [
        variantId,
        jobId,
      ]);
    }

    res.json({
      variantId,
      original: resume,
      tailored: validated.data,
    });
  } catch (error) {
    console.error("Tailoring error:", error);
    res.status(500).json({
      error: "Failed to tailor resume",
      details: error instanceof Error ? error.message : String(error),
    });
  } finally {
    connection.release();
  }
});

router.get("/variants", async (_req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT id, job_title, company_name, created_at FROM resume_variants ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch variants" });
  } finally {
    connection.release();
  }
});

router.get("/variants/:id", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM resume_variants WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Variant not found" });
    const variant = rows[0];
    res.json({
      id: variant.id,
      jobTitle: variant.job_title,
      companyName: variant.company_name,
      jobDescription: variant.job_description,
      tailoredData:
        typeof variant.tailored_data === "string"
          ? JSON.parse(variant.tailored_data)
          : variant.tailored_data,
      createdAt: variant.created_at,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch variant" });
  } finally {
    connection.release();
  }
});

export default router;
