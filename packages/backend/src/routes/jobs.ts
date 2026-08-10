import { Router } from "express";
import { pool } from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const router = Router();

router.get("/", async (req, res) => {
  const { collectionId } = req.query;

  let query = `SELECT 
              id,
              company_name AS companyName,
              job_title AS jobTitle,
              job_url AS jobUrl,
              job_description AS jobDescription,
              fit_score AS fitScore,
              seniority_level AS seniorityLevel,
              salary,
              applicants_count AS applicantsCount,
              posted_at AS postedAt,
              suggested_focus AS suggestedFocus,
              reasoning,
              status,
              variant_id AS variantId,
              collection_id AS collectionId
            FROM jobs`;

  const params: (string | number)[] = [];

  if (collectionId) {
    query += ` WHERE collection_id = ?`;
    params.push(collectionId as string);
  }

  query += ` ORDER BY created_at DESC`;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

router.post("/", async (req, res) => {
  const {
    companyName,
    jobTitle,
    jobUrl,
    jobDescription,
    fitScore,
    seniorityLevel,
    salary,
    applicantsCount,
    postedAt,
    suggestedFocus,
    reasoning,
  } = req.body;

  if (!companyName || !jobTitle) {
    return res
      .status(400)
      .json({ error: "Company name and job title are required" });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO jobs 
        (company_name, job_title, job_url, job_description, fit_score, seniority_level, salary, applicants_count, posted_at, suggested_focus, reasoning)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyName,
        jobTitle,
        jobUrl || null,
        jobDescription || null,
        fitScore || null,
        seniorityLevel || null,
        salary || null,
        applicantsCount || null,
        postedAt || null,
        suggestedFocus || null,
        reasoning || null,
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "ER_DUP_ENTRY"
    ) {
      return res
        .status(409)
        .json({ error: "A job with this URL already exists" });
    }
    console.error("Error creating job:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

router.patch("/:id/variant", async (req, res) => {
  const { id } = req.params;
  const { variantId } = req.body;

  if (!variantId) {
    return res.status(400).json({ error: "variantId is required" });
  }

  try {
    await pool.query(
      "UPDATE jobs SET variant_id = ?, status = 'tailored' WHERE id = ?",
      [variantId, id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating job variant:", error);
    res.status(500).json({ error: "Failed to update job variant" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM jobs WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: "Failed to delete job" });
  }
});

export default router;
