import { Router } from "express";
import { pool } from "../db";
import { ResumeSaveSchema } from "@resumeai/shared";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ZodError, ZodIssue } from "zod";
import { isResumeComplete } from "../services/resumeValidation";

const router = Router();

router.get("/list", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        r.id, 
        r.name, 
        r.summary, 
        r.is_default AS isDefault,
        r.is_complete AS isComplete,
        r.created_at AS createdAt,
        r.updated_at AS updatedAt,
        COUNT(v.id) AS variantCount,
        EXISTS (
          SELECT 1 FROM job_collections c WHERE c.base_resume_id = r.id
        ) AS hasCollections
      FROM resumes r
      LEFT JOIN resume_variants v ON v.resume_id = r.id
      GROUP BY r.id
      ORDER BY r.is_default DESC, r.updated_at DESC;`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching resumes:", error);
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
});

async function fetchFullResumeData(
  connection: Awaited<ReturnType<typeof pool.getConnection>>,
  resumeId: number
) {
  const [resumeRows] = await connection.query<RowDataPacket[]>(
    "SELECT id, name, summary FROM resumes WHERE id = ?",
    [resumeId]
  );
  if (resumeRows.length === 0) return null;

  const name = resumeRows[0].name || "Untitled";

  const summary = resumeRows[0].summary;

  const [personalRows] = await connection.query<RowDataPacket[]>(
    "SELECT * FROM personal_info WHERE resume_id = ?",
    [resumeId]
  );
  const personal = personalRows[0] || {
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  };

  const [categoryRows] = await connection.query<RowDataPacket[]>(
    "SELECT id, category, display_order FROM skill_categories WHERE resume_id = ? ORDER BY display_order",
    [resumeId]
  );

  const skills = await Promise.all(
    categoryRows.map(async (cat: RowDataPacket) => {
      const [skillRows] = await connection.query<RowDataPacket[]>(
        "SELECT skill FROM skills WHERE category_id = ? ORDER BY display_order",
        [cat.id]
      );
      return {
        id: String(cat.id),
        category: cat.category,
        items: skillRows.map((row: RowDataPacket) => row.skill),
        displayOrder: cat.display_order,
      };
    })
  );

  const [companyRows] = await connection.query<RowDataPacket[]>(
    "SELECT id, company_name, location, display_order FROM experience_companies WHERE resume_id = ? ORDER BY display_order",
    [resumeId]
  );

  const experience = await Promise.all(
    companyRows.map(async (company: RowDataPacket) => {
      const [roleRows] = await connection.query<RowDataPacket[]>(
        "SELECT id, title, employment_type, start_date, end_date, display_order FROM experience_roles WHERE company_id = ? ORDER BY display_order",
        [company.id]
      );

      const roles = await Promise.all(
        roleRows.map(async (role: RowDataPacket) => {
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
            bullets: bulletRows.map((b: RowDataPacket) => ({
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
    projectRows.map(async (project: RowDataPacket) => {
      const [bulletRows] = await connection.query<RowDataPacket[]>(
        "SELECT id, content, display_order FROM project_bullets WHERE project_id = ? ORDER BY display_order",
        [project.id]
      );
      return {
        id: String(project.id),
        name: project.name,
        url: project.url || "",
        displayOrder: project.display_order,
        bullets: bulletRows.map((b: RowDataPacket) => ({
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

  const education = educationRows.map((e: RowDataPacket) => ({
    id: String(e.id),
    institution: e.institution,
    degree: e.degree,
    field: e.field,
    graduationYear: e.graduation_year,
    displayOrder: e.display_order,
  }));

  return {
    name,
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
    summary: summary || "",
    skills,
    experience,
    projects,
    education,
  };
}

// GET /api/v1/resume
router.get("/", async (req, res) => {
  const { id } = req.query;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let resumeId: number | null = null;

    if (id) {
      // Fetch by provided ID
      const [rows] = await connection.query<RowDataPacket[]>(
        "SELECT id FROM resumes WHERE id = ?",
        [id]
      );
      if (rows.length > 0) {
        resumeId = rows[0].id;
      } else {
        // ID provided but not found – return 404
        await connection.commit();
        return res.status(404).json({ error: "Resume not found" });
      }
    } else {
      // No ID: fetch default (is_default=TRUE), else fallback to first
      const [defaultRow] = await connection.query<RowDataPacket[]>(
        "SELECT id FROM resumes WHERE is_default = TRUE LIMIT 1"
      );
      if (defaultRow.length > 0) {
        resumeId = defaultRow[0].id;
      } else {
        const [firstRow] = await connection.query<RowDataPacket[]>(
          "SELECT id FROM resumes ORDER BY id LIMIT 1"
        );
        if (firstRow.length > 0) {
          resumeId = firstRow[0].id;
        }
      }
    }

    // If no resume found at all, return empty resume (as before)
    if (resumeId === null) {
      await connection.commit();
      return res.json({
        name,
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
      });
    }

    // Fetch full resume data
    const fullResume = await fetchFullResumeData(connection, resumeId);
    await connection.commit();

    if (!fullResume) {
      // Should not happen, but handle gracefully
      return res.status(404).json({ error: "Resume data not found" });
    }

    res.json(fullResume);
  } catch (error) {
    await connection.rollback();
    console.error("Error fetching resume:", error);
    res.status(500).json({ error: "Failed to fetch resume" });
  } finally {
    connection.release();
  }
});

router.post("/", async (req, res) => {
  const normalizedBody = {
    ...req.body,
    skills: req.body.skills || [],
    experience: req.body.experience || [],
    projects: req.body.projects || [],
    education: req.body.education || [],
  };

  const { name, isDefault, resumeId } = req.body;

  const parsed = ResumeSaveSchema.safeParse(normalizedBody);
  if (!parsed.success) {
    const zodError = parsed.error as unknown as ZodError;
    const errors = zodError.errors.map((err: ZodIssue) => ({
      path: err.path.join("."),
      message: err.message,
    }));
    return res.status(400).json({ errors });
  }

  const data = parsed.data;
  const skills = data.skills ?? [];
  const experience = data.experience ?? [];
  const projects = data.projects ?? [];
  const education = data.education ?? [];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // If this resume is to be the default, unset all others
    if (isDefault) {
      await connection.query(
        "UPDATE resumes SET is_default = FALSE WHERE is_default = TRUE"
      );
    }

    let resumeIdToUse: number;

    if (resumeId) {
      // ✅ Update existing resume
      await connection.query(
        "UPDATE resumes SET summary = ?, name = ?, is_default = ? WHERE id = ?",
        [data.summary || "", name || "My Resume", isDefault || false, resumeId]
      );
      resumeIdToUse = resumeId;

      // Delete existing related sections
      await connection.query("DELETE FROM personal_info WHERE resume_id = ?", [
        resumeId,
      ]);
      await connection.query(
        "DELETE FROM skill_categories WHERE resume_id = ?",
        [resumeId]
      );
      await connection.query(
        "DELETE FROM experience_companies WHERE resume_id = ?",
        [resumeId]
      );
      await connection.query("DELETE FROM projects WHERE resume_id = ?", [
        resumeId,
      ]);
      await connection.query("DELETE FROM education WHERE resume_id = ?", [
        resumeId,
      ]);
    } else {
      // ✅ Create new resume
      const [result] = await connection.query<ResultSetHeader>(
        "INSERT INTO resumes (summary, name, is_default) VALUES (?, ?, ?)",
        [data.summary || "", name || "My Resume", isDefault || false]
      );
      resumeIdToUse = result.insertId;
    }

    // Insert personal_info
    await connection.query(
      `INSERT INTO personal_info 
         (resume_id, name, title, email, phone, location, linkedin, github, portfolio) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resumeIdToUse,
        data.personal?.name || "",
        data.personal?.title || "",
        data.personal?.email || "",
        data.personal?.phone || "",
        data.personal?.location || "",
        data.personal?.linkedin || "",
        data.personal?.github || "",
        data.personal?.portfolio || "",
      ]
    );

    // Insert skills
    for (const skillCat of skills) {
      const [catResult] = await connection.query<ResultSetHeader>(
        "INSERT INTO skill_categories (resume_id, category, display_order) VALUES (?, ?, ?)",
        [resumeIdToUse, skillCat.category, skillCat.displayOrder || 0]
      );
      const catId = catResult.insertId;
      for (let i = 0; i < (skillCat.items ?? []).length; i++) {
        await connection.query(
          "INSERT INTO skills (category_id, skill, display_order) VALUES (?, ?, ?)",
          [catId, skillCat.items[i], i]
        );
      }
    }

    // Insert experience
    for (const company of experience) {
      const [companyResult] = await connection.query<ResultSetHeader>(
        "INSERT INTO experience_companies (resume_id, company_name, location, display_order) VALUES (?, ?, ?, ?)",
        [
          resumeIdToUse,
          company.companyName,
          company.location,
          company.displayOrder || 0,
        ]
      );
      const companyId = companyResult.insertId;
      for (const role of company.roles ?? []) {
        const [roleResult] = await connection.query<ResultSetHeader>(
          `INSERT INTO experience_roles 
             (company_id, title, employment_type, start_date, end_date, display_order) 
             VALUES (?, ?, ?, ?, ?, ?)`,
          [
            companyId,
            role.title,
            role.employmentType || "full-time",
            role.startDate || "",
            role.endDate || "",
            role.displayOrder || 0,
          ]
        );
        const roleId = roleResult.insertId;
        for (let i = 0; i < (role.bullets ?? []).length; i++) {
          await connection.query(
            "INSERT INTO experience_bullets (role_id, content, display_order) VALUES (?, ?, ?)",
            [roleId, role.bullets[i].content, i]
          );
        }
      }
    }

    // Insert projects
    for (const project of projects) {
      const [projectResult] = await connection.query<ResultSetHeader>(
        "INSERT INTO projects (resume_id, name, url, display_order) VALUES (?, ?, ?, ?)",
        [
          resumeIdToUse,
          project.name,
          project.url || "",
          project.displayOrder || 0,
        ]
      );
      const projectId = projectResult.insertId;
      for (let i = 0; i < (project.bullets ?? []).length; i++) {
        await connection.query(
          "INSERT INTO project_bullets (project_id, content, display_order) VALUES (?, ?, ?)",
          [projectId, project.bullets[i].content, i]
        );
      }
    }

    // Insert education
    for (const edu of education) {
      await connection.query(
        `INSERT INTO education 
           (resume_id, institution, degree, field, graduation_year, display_order) 
           VALUES (?, ?, ?, ?, ?, ?)`,
        [
          resumeIdToUse,
          edu.institution,
          edu.degree,
          edu.field,
          edu.graduationYear,
          edu.displayOrder || 0,
        ]
      );
    }

    const complete = isResumeComplete(data);
    await connection.query("UPDATE resumes SET is_complete = ? WHERE id = ?", [
      complete,
      resumeIdToUse,
    ]);

    await connection.commit();
    res.status(201).json({ id: resumeIdToUse });
  } catch (error) {
    await connection.rollback();
    console.error("Error saving resume:", error);
    res.status(500).json({
      error: "Failed to save resume",
      details: error instanceof Error ? error.message : String(error),
    });
  } finally {
    connection.release();
  }
});

router.patch("/:id/default", async (req, res) => {
  const { id } = req.params;
  const { isDefault } = req.body;

  if (typeof isDefault !== "boolean") {
    return res.status(400).json({ error: "isDefault must be a boolean" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (isDefault) {
      await connection.query(
        "UPDATE resumes SET is_default = FALSE WHERE is_default = TRUE"
      );
    }

    await connection.query("UPDATE resumes SET is_default = ? WHERE id = ?", [
      isDefault,
      id,
    ]);

    await connection.commit();
    res.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating default:", error);
    res.status(500).json({ error: "Failed to update default" });
  } finally {
    connection.release();
  }
});

// delete resumes

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Check if the resume exists
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM resumes WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Resume not found" });
    }

    // The foreign key constraints will handle cascading deletes:
    // - job_collections.base_resume_id ON DELETE CASCADE → deletes collections → deletes jobs → deletes variants
    // - resume_variants.resume_id has NO ACTION, so if variants exist, the delete will be blocked.
    // This is desired – you cannot delete a resume that has variants.
    await pool.query("DELETE FROM resumes WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting resume:", error);
    // If the error is due to foreign key constraint (variants exist), send a user-friendly message
    if (
      error instanceof Error &&
      error.message.includes("foreign key constraint")
    ) {
      return res.status(409).json({
        error:
          "Cannot delete this resume because it has variants. Delete the variants first or remove their links to jobs.",
      });
    }
    res.status(500).json({ error: "Failed to delete resume" });
  }
});

router.get("/variants/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id,
        resume_id,
        job_id AS jobId,
        job_title AS jobTitle,
        company_name AS companyName,
        job_description AS jobDescription,
        tailored_data AS tailoredData,
        created_at AS createdAt
      FROM resume_variants
      WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Variant not found" });
    }
    const variant = rows[0];
    res.json({
      id: variant.id,
      resumeId: variant.resume_id,
      jobId: variant.jobId,
      jobTitle: variant.jobTitle,
      companyName: variant.companyName,
      jobDescription: variant.jobDescription,
      tailoredData:
        typeof variant.tailoredData === "string"
          ? JSON.parse(variant.tailoredData)
          : variant.tailoredData,
      createdAt: variant.createdAt,
    });
  } catch (error) {
    console.error("Error fetching variant:", error);
    res.status(500).json({ error: "Failed to fetch variant" });
  }
});

router.get("/:resumeId/variants", async (req, res) => {
  const { resumeId } = req.params;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        rv.id,
        rv.job_id AS jobId,
        rv.job_title AS jobTitle,
        rv.company_name AS companyName,
        rv.created_at AS createdAt,
        j.job_url AS jobUrl,
        j.fit_score AS fitScore
      FROM resume_variants rv
      LEFT JOIN jobs j ON j.id = rv.job_id
      WHERE rv.resume_id = ?
      ORDER BY rv.created_at DESC`,
      [resumeId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching variants:", error);
    res.status(500).json({ error: "Failed to fetch variants" });
  }
});

export default router;
