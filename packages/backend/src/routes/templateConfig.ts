import { Router } from "express";
import { pool } from "../db";
import { TemplateConfigSchema, defaultTemplateConfig } from "@resumeai/shared";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { ZodError, ZodIssue } from "zod";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT config FROM template_config ORDER BY id DESC LIMIT 1"
    );

    if (rows.length === 0) {
      return res.json(defaultTemplateConfig);
    }

    const config =
      typeof rows[0].config === "string"
        ? JSON.parse(rows[0].config)
        : rows[0].config;

    res.json(config);
  } catch (error) {
    console.error("Error fetching template config:", error);
    res.status(500).json({ error: "Failed to fetch template config" });
  }
});

router.put("/", async (req, res) => {
  const parsed = TemplateConfigSchema.safeParse(req.body);

  if (!parsed.success) {
    const zodError = parsed.error as unknown as ZodError;
    const errors = zodError.errors.map((err: ZodIssue) => ({
      path: err.path.join("."),
      message: err.message,
    }));
    return res.status(400).json({ errors });
  }

  try {
    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM template_config LIMIT 1"
    );

    if (existing.length > 0) {
      await pool.query("UPDATE template_config SET config = ? WHERE id = ?", [
        JSON.stringify(parsed.data),
        existing[0].id,
      ]);
    } else {
      await pool.query<ResultSetHeader>(
        "INSERT INTO template_config (config) VALUES (?)",
        [JSON.stringify(parsed.data)]
      );
    }

    res.json(parsed.data);
  } catch (error) {
    console.error("Error saving template config:", error);
    res.status(500).json({ error: "Failed to save template config" });
  }
});

export default router;
