import { Router } from "express";
import { pool } from "../db";
import { ResumeSchema } from "@resumeai/shared";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ZodError, ZodIssue } from "zod";

const router = Router();

// ─── GET Resume ──────────────────────────────────────────────────────────────

router.get("/", async (_req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Get the first resume (single user for now)
    const [resumeRows] = await connection.query<RowDataPacket[]>(
      "SELECT id, summary FROM resumes LIMIT 1"
    );

    // If no resume exists, return empty structure
    if (resumeRows.length === 0) {
      await connection.commit();
      return res.json({
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

    const resumeId = resumeRows[0].id;
    const summary = resumeRows[0].summary;

    // ── Personal Info ──────────────────────────────────────────────────────
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

    // ── Skills ─────────────────────────────────────────────────────────────
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
          id: cat.id,
          category: cat.category,
          items: skillRows.map((row: RowDataPacket) => row.skill),
          displayOrder: cat.display_order,
        };
      })
    );

    // ── Experience ─────────────────────────────────────────────────────────
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
              id: role.id,
              title: role.title,
              employmentType: role.employment_type,
              startDate: role.start_date,
              endDate: role.end_date,
              displayOrder: role.display_order,
              bullets: bulletRows.map((b: RowDataPacket) => ({
                id: b.id,
                content: b.content,
                displayOrder: b.display_order,
              })),
            };
          })
        );

        return {
          id: company.id,
          companyName: company.company_name,
          location: company.location,
          displayOrder: company.display_order,
          roles,
        };
      })
    );

    // ── Projects ───────────────────────────────────────────────────────────
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
          id: project.id,
          name: project.name,
          url: project.url || "",
          displayOrder: project.display_order,
          bullets: bulletRows.map((b: RowDataPacket) => ({
            id: b.id,
            content: b.content,
            displayOrder: b.display_order,
          })),
        };
      })
    );

    // ── Education ──────────────────────────────────────────────────────────
    const [educationRows] = await connection.query<RowDataPacket[]>(
      "SELECT id, institution, degree, field, graduation_year, display_order FROM education WHERE resume_id = ? ORDER BY display_order",
      [resumeId]
    );

    const education = educationRows.map((e: RowDataPacket) => ({
      id: e.id,
      institution: e.institution,
      degree: e.degree,
      field: e.field,
      graduationYear: e.graduation_year,
      displayOrder: e.display_order,
    }));

    await connection.commit();

    res.json({
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
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error fetching resume:", error);
    res.status(500).json({ error: "Failed to fetch resume" });
  } finally {
    connection.release();
  }
});

router.post("/", async (req, res) => {
  const parsed = ResumeSchema.safeParse(req.body);

  if (!parsed.success) {
    const zodError = parsed.error as unknown as ZodError;
    const errors = zodError.errors.map((err: ZodIssue) => ({
      path: err.path.join("."),
      message: err.message,
    }));
    return res.status(400).json({ errors });
  }

  const data = parsed.data;
  const skills = data.skills || [];
  const experience = data.experience || [];
  const projects = data.projects || [];
  const education = data.education || [];

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Check if a resume exists
    const [existing] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM resumes LIMIT 1"
    );

    let resumeId: string;

    if (existing.length > 0) {
      // Update existing resume
      resumeId = String(existing[0].id);
      console.log("Updating existing resume ID:", resumeId);

      await connection.query("UPDATE resumes SET summary = ? WHERE id = ?", [
        data.summary || "",
        resumeId,
      ]);

      // Delete all child records for this resume
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
      // Insert new resume
      const [result] = await connection.query<ResultSetHeader>(
        "INSERT INTO resumes (summary) VALUES (?)",
        [data.summary || ""]
      );
      resumeId = String(result.insertId);
      console.log("Created new resume ID:", resumeId);
    }

    // ── Personal Info ──────────────────────────────────────────────────────
    await connection.query(
      `INSERT INTO personal_info 
         (resume_id, name, title, email, phone, location, linkedin, github, portfolio) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resumeId,
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

    // ── Skills ─────────────────────────────────────────────────────────────
    for (const skillCat of skills) {
      const [catResult] = await connection.query<ResultSetHeader>(
        "INSERT INTO skill_categories (resume_id, category, display_order) VALUES (?, ?, ?)",
        [resumeId, skillCat.category, skillCat.displayOrder || 0]
      );
      const catId = String(catResult.insertId);

      for (let i = 0; i < skillCat.items.length; i++) {
        await connection.query(
          "INSERT INTO skills (category_id, skill, display_order) VALUES (?, ?, ?)",
          [catId, skillCat.items[i], i]
        );
      }
    }

    // ── Experience ─────────────────────────────────────────────────────────
    for (const company of experience) {
      const [companyResult] = await connection.query<ResultSetHeader>(
        "INSERT INTO experience_companies (resume_id, company_name, location, display_order) VALUES (?, ?, ?, ?)",
        [
          resumeId,
          company.companyName,
          company.location,
          company.displayOrder || 0,
        ]
      );
      const companyId = String(companyResult.insertId);

      for (const role of company.roles || []) {
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
        const roleId = String(roleResult.insertId);

        for (let i = 0; i < role.bullets.length; i++) {
          await connection.query(
            "INSERT INTO experience_bullets (role_id, content, display_order) VALUES (?, ?, ?)",
            [roleId, role.bullets[i].content, i]
          );
        }
      }
    }

    // ── Projects ───────────────────────────────────────────────────────────
    for (const project of projects) {
      const [projectResult] = await connection.query<ResultSetHeader>(
        "INSERT INTO projects (resume_id, name, url, display_order) VALUES (?, ?, ?, ?)",
        [resumeId, project.name, project.url || "", project.displayOrder || 0]
      );
      const projectId = String(projectResult.insertId);

      for (let i = 0; i < (project.bullets || []).length; i++) {
        await connection.query(
          "INSERT INTO project_bullets (project_id, content, display_order) VALUES (?, ?, ?)",
          [projectId, project.bullets[i].content, i]
        );
      }
    }

    // ── Education ──────────────────────────────────────────────────────────
    for (const edu of education) {
      await connection.query(
        `INSERT INTO education 
           (resume_id, institution, degree, field, graduation_year, display_order) 
           VALUES (?, ?, ?, ?, ?, ?)`,
        [
          resumeId,
          edu.institution,
          edu.degree,
          edu.field,
          edu.graduationYear,
          edu.displayOrder || 0,
        ]
      );
    }

    await connection.commit();
    res.status(201).json({ id: resumeId });
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
export default router;
