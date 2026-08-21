import { Router } from "express";
import { ApifyService } from "../services/apifyService";
import { buildLinkedInUrl } from "../utils/linkedinUrlBuilder";

const router = Router();

router.get("/", async (req, res) => {
  const { keywords, location, maxItems } = req.query;

  if (!keywords) {
    return res.status(400).json({
      error:
        "Missing keywords. Usage: /api/v1/test-apify?keywords=Full%20Stack%20Developer&location=Canada&maxItems=5",
    });
  }

  try {
    const apiKey = await ApifyService.getApiKey();
    if (!apiKey) {
      return res
        .status(400)
        .json({ error: "Apify API key not configured. Please save it first." });
    }

    const url = buildLinkedInUrl(
      keywords as string,
      (location as string) || "",
      { timeRange: "7d", sortBy: "recent" }
    );
    // console.log(`[Test] Built URL: ${url}`);

    const apifyService = new ApifyService(apiKey);

    const max = maxItems ? parseInt(maxItems as string, 10) : 5;
    const jobs = await apifyService.scrapeJobs(url, max);

    res.json({
      success: true,
      url: url,
      jobsFound: jobs.length,
      jobs: jobs.map((job) => ({
        title: job.title,
        company: job.companyName,
        link: job.link,
        descriptionPreview: job.descriptionText?.substring(0, 200) + "...",
        postedAt: job.postedAt,
        salary: job.salary,
      })),
    });
  } catch (error) {
    console.error("[Test Apify] Error:", error);
    res.status(500).json({
      error: "Scrape failed",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
