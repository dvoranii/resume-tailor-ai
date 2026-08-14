import { pool } from "../db";
import { RowDataPacket } from "mysql2";

const OPENAI_MODEL = "gpt-4o-mini";

export const MIN_FIT_SCORE = 50;

interface ScoreResult {
  score: number;
  reasoning?: string;
  suggestedFocus?: string;
}

async function getOpenAIKey(): Promise<string | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT api_key FROM user_api_keys WHERE user_id = 1 AND provider = 'openai' LIMIT 1`
  );
  return rows.length > 0 ? (rows[0].api_key as string) : null;
}

export async function fetchResumeText(resumeId: number): Promise<string> {
  const [resumeRows] = await pool.query<RowDataPacket[]>(
    `SELECT summary FROM resumes WHERE id = ?`,
    [resumeId]
  );
  const summary = resumeRows[0]?.summary || "";

  const [skillRows] = await pool.query<RowDataPacket[]>(
    `SELECT s.skill
     FROM skill_categories sc
     JOIN skills s ON s.category_id = sc.id
     WHERE sc.resume_id = ?
     ORDER BY sc.display_order, s.display_order`,
    [resumeId]
  );
  const skillsText = skillRows.map((r) => r.skill).join(", ");

  const [bulletRows] = await pool.query<RowDataPacket[]>(
    `SELECT eb.content
     FROM experience_bullets eb
     JOIN experience_roles er ON er.id = eb.role_id
     JOIN experience_companies ec ON ec.id = er.company_id
     WHERE ec.resume_id = ?
     ORDER BY ec.display_order, er.display_order, eb.display_order
     LIMIT 20`,
    [resumeId]
  );
  const bulletsText = bulletRows.map((r) => `- ${r.content}`).join("\n");

  return `SUMMARY:\n${summary}\n\nSKILLS:\n${skillsText}\n\nEXPERIENCE HIGHLIGHTS:\n${bulletsText}`;
}

export async function scoreJobAgainstResume(
  jobDescription: string,
  resumeId: number
): Promise<ScoreResult> {
  try {
    console.log("🔍 [Scoring] Starting scoring for resume ID:", resumeId);

    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      console.warn("⚠️ [Scoring] No OpenAI API key found in user_api_keys");
      return { score: 0, reasoning: "Scoring skipped: no API key configured" };
    }
    console.log("✅ [Scoring] OpenAI key found (length:", apiKey.length, ")");

    const resumeText = await fetchResumeText(resumeId);
    console.log("📄 [Scoring] Resume text length:", resumeText.length);

    const prompt = `You are an expert technical recruiter. Compare the following resume to the job description and rate how well the candidate fits, from 0 to 100.
  
  RESUME:
  ${resumeText}
  
  JOB DESCRIPTION:
  ${jobDescription}
  
  Respond ONLY with a JSON object in this exact shape, no markdown, no preamble:
  {"score": <integer 0-100>, "reasoning": "<one to two sentence explanation>", "suggestedFocus": "<one short sentence on what to emphasize if tailoring this resume for this job>"}`;

    console.log("📤 [Scoring] Sending request to OpenAI...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    console.log(`📥 [Scoring] OpenAI response status: ${response.status}`);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ [Scoring] OpenAI error ${response.status}:`, errText);
      return {
        score: 0,
        reasoning: `Scoring failed (HTTP ${response.status})`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.warn("⚠️ [Scoring] No content in OpenAI response");
      return { score: 0, reasoning: "Scoring failed: empty response" };
    }

    console.log(
      "📝 [Scoring] Raw response content:",
      content.substring(0, 200) + "..."
    );

    const parsed = JSON.parse(content);
    const score = Math.max(0, Math.min(100, Number(parsed.score) || 0));

    console.log(
      `✅ [Scoring] Score: ${score}, Reasoning: ${parsed.reasoning || "N/A"}`
    );

    return {
      score,
      reasoning: parsed.reasoning || undefined,
      suggestedFocus: parsed.suggestedFocus || undefined,
    };
  } catch (error) {
    console.error("❌ [Scoring] Exception:", error);
    return { score: 0, reasoning: "Scoring failed (exception)" };
  }
}
