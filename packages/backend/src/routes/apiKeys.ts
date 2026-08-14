import { Router } from "express";
import { pool } from "../db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const router = Router();

router.post("/", async (req, res) => {
  const { provider, apiKey } = req.body;

  if (!provider || !apiKey) {
    return res.status(400).json({ error: "Provider and API key are required" });
  }

  const validProviders = ["apify", "openai"];
  if (!validProviders.includes(provider)) {
    return res
      .status(400)
      .json({ error: "Invalid provider. Must be apify or openai" });
  }

  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO user_api_keys (user_id, provider, api_key)
       VALUES (1, ?, ?)
       ON DUPLICATE KEY UPDATE 
         api_key = VALUES(api_key),
         updated_at = CURRENT_TIMESTAMP`,
      [provider, apiKey]
    );

    res.json({
      success: true,
      message: `API key for ${provider} saved successfully`,
      affectedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("Error saving API key:", error);
    res.status(500).json({ error: "Failed to save API key" });
  } finally {
    connection.release();
  }
});

router.get("/:provider", async (req, res) => {
  const { provider } = req.params;

  const validProviders = ["apify", "openai"];
  if (!validProviders.includes(provider)) {
    return res
      .status(400)
      .json({ error: "Invalid provider. Must be apify or openai" });
  }

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT api_key, created_at, updated_at FROM user_api_keys WHERE user_id = 1 AND provider = ?",
      [provider]
    );

    if (rows.length === 0) {
      return res.json({ apiKey: null, exists: false });
    }

    res.json({
      apiKey: rows[0].api_key,
      exists: true,
      createdAt: rows[0].created_at,
      updatedAt: rows[0].updated_at,
    });
  } catch (error) {
    console.error("Error fetching API key:", error);
    res.status(500).json({ error: "Failed to fetch API key" });
  } finally {
    connection.release();
  }
});

// DELETE /api/v1/api-keys/:provider
// Delete an API key (optional, for security)
router.delete("/:provider", async (req, res) => {
  const { provider } = req.params;

  const validProviders = ["apify", "openai"];
  if (!validProviders.includes(provider)) {
    return res
      .status(400)
      .json({ error: "Invalid provider. Must be apify or openai" });
  }

  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM user_api_keys WHERE user_id = 1 AND provider = ?",
      [provider]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: `No API key found for provider: ${provider}` });
    }

    res.json({ success: true, message: `API key for ${provider} deleted` });
  } catch (error) {
    console.error("Error deleting API key:", error);
    res.status(500).json({ error: "Failed to delete API key" });
  } finally {
    connection.release();
  }
});

export default router;
