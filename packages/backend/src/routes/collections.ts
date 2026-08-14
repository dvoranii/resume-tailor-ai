import { Router } from "express";
import { pool } from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ApifyService } from "../services/apifyService";
import { buildLinkedInUrl } from "../utils/linkedinUrlBuilder";
import {
  scoreJobAgainstResume,
  MIN_FIT_SCORE,
} from "../services/scoringService";

const router = Router();
const MIN_ITEMS = 10;

// POST /api/v1/collections
router.post("/", async (req, res) => {
  const { name, searchQuery, location, filters, maxItems, baseResumeId } =
    req.body;

  if (!name || !searchQuery) {
    return res.status(400).json({ error: "name and searchQuery are required" });
  }

  const clampedMax = Math.max(Number(maxItems) || 25, MIN_ITEMS);
  const constructedUrl = buildLinkedInUrl(
    searchQuery,
    location || "",
    filters || {}
  );

  try {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO job_collections
        (user_id, name, search_query, search_location, search_filters, constructed_url, max_items, base_resume_id)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        searchQuery,
        location || null,
        JSON.stringify(filters || {}),
        constructedUrl,
        clampedMax,
        baseResumeId || null,
      ]
    );
    res.status(201).json({ id: result.insertId, constructedUrl });
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({ error: "Failed to create collection" });
  }
});

// GET /api/v1/collections
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        c.id, c.name, c.search_query AS searchQuery, c.search_location AS location,
        c.constructed_url AS constructedUrl, c.max_items AS maxItems,
        c.base_resume_id AS baseResumeId,
        c.last_scraped_at AS lastScrapedAt, c.total_jobs_found AS totalJobsFound,
        COUNT(j.id) AS jobCount
      FROM job_collections c
      LEFT JOIN jobs j ON j.collection_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
});

// GET /api/v1/collections/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, search_query AS searchQuery, search_location AS location,
              constructed_url AS constructedUrl, max_items AS maxItems,
              base_resume_id AS baseResumeId,
              last_scraped_at AS lastScrapedAt, total_jobs_found AS totalJobsFound
       FROM job_collections WHERE id = ?`,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Collection not found" });
    const collection = rows[0];

    const [jobs] = await pool.query<RowDataPacket[]>(
      `SELECT id, company_name AS companyName, job_title AS jobTitle, job_url AS jobUrl,
              fit_score AS fitScore, status, variant_id AS variantId, scraped_at AS scrapedAt
       FROM jobs WHERE collection_id = ? ORDER BY scraped_at DESC`,
      [id]
    );
    res.json({ ...collection, jobs });
  } catch (error) {
    console.error("Error fetching collection:", error);
    res.status(500).json({ error: "Failed to fetch collection" });
  }
});

// POST /api/v1/collections/:id/scrape
router.post("/:id/scrape", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, constructed_url AS constructedUrl, max_items AS maxItems, base_resume_id AS baseResumeId FROM job_collections WHERE id = ?`,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Collection not found" });
    const collection = rows[0];

    if (!collection.baseResumeId) {
      return res.status(400).json({
        error:
          "This collection has no base resume selected. Set one before scraping.",
      });
    }

    const apiKey = await ApifyService.getApiKey();
    if (!apiKey)
      return res.status(400).json({ error: "Apify API key not configured" });

    const apifyService = new ApifyService(apiKey);
    const jobs = await apifyService.scrapeJobs(
      collection.constructedUrl,
      collection.maxItems
    );

    let saved = 0;
    let skipped = 0;

    for (const job of jobs) {
      if (!job.id) continue;

      const scoreResult = await scoreJobAgainstResume(
        job.descriptionText,
        collection.baseResumeId
      );

      if (scoreResult.score < MIN_FIT_SCORE) {
        skipped++;
        continue;
      }

      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO jobs
          (company_name, job_title, job_url, job_description, seniority_level, salary,
           applicants_count, posted_at, collection_id, apify_id, is_auto_scraped, scraped_at,
           status, fit_score, reasoning, suggested_focus, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), 'new', ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
           collection_id = VALUES(collection_id), 
           job_description = VALUES(job_description),
           applicants_count = VALUES(applicants_count),
           fit_score = VALUES(fit_score),
           reasoning = VALUES(reasoning),
           suggested_focus = VALUES(suggested_focus),
           scraped_at = NOW()`,
        [
          job.companyName,
          job.title,
          job.link,
          job.descriptionText,
          job.seniorityLevel,
          job.salary,
          job.applicantsCount,
          job.postedAt,
          id,
          job.id,
          scoreResult.score,
          scoreResult.reasoning || null,
          scoreResult.suggestedFocus || null,
        ]
      );
      if (result.affectedRows >= 1) saved++;
    }

    await pool.query(
      `UPDATE job_collections SET last_scraped_at = NOW(), total_jobs_found = ? WHERE id = ?`,
      [saved, id]
    );

    res.json({
      success: true,
      scraped: jobs.length,
      saved,
      skipped,
    });
  } catch (error) {
    console.error("Error scraping collection:", error);
    res.status(500).json({
      error: "Scrape failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// DELETE /api/v1/collections/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE jobs SET collection_id = NULL WHERE collection_id = ?`,
      [id]
    );
    await pool.query(`DELETE FROM job_collections WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    res.status(500).json({ error: "Failed to delete collection" });
  }
});

export default router;
