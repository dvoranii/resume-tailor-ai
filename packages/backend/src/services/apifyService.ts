import { ApifyClient } from "apify-client";
import { pool } from "../db";
import { RowDataPacket } from "mysql2";

interface ApifyJob {
  id: string;
  title: string;
  companyName: string;
  link: string;
  descriptionText: string;
  seniorityLevel?: string | null;
  salary?: string | null;
  applicantsCount?: number | null;
  postedAt?: string | null;
  companyLogo?: string | null;
  location?: string | null;
}

export class ApifyService {
  private client: ApifyClient | null = null;
  private apiKey: string | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new ApifyClient({ token: apiKey });
  }

  /**
   * Get the Apify API key from the database
   */
  static async getApiKey(): Promise<string | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT api_key FROM user_api_keys WHERE user_id = 1 AND provider = "apify"'
    );
    return rows.length > 0 ? rows[0].api_key : null;
  }

  /**
   * Scrape jobs from LinkedIn using Apify
   */
  async scrapeJobs(
    linkedInUrl: string,
    maxItems: number = 50
  ): Promise<ApifyJob[]> {
    if (!this.client) {
      throw new Error("Apify client not initialized");
    }

    const actorId = "curious_coder~linkedin-jobs-scraper";

    const requestedCount = Math.max(maxItems, 10);

    const runInput = {
      urls: [linkedInUrl],
      count: requestedCount,
      scrapeCompany: true, // set false if you don't need company detail scrapes
    };

    console.log(`[Apify] Starting scrape for URL: ${linkedInUrl}`);
    console.log(`[Apify] Requesting up to ${maxItems} jobs`);

    try {
      const run = await this.client.actor(actorId).call(runInput);
      console.log(
        `[Apify] Actor run finished: ${run.id}, status: ${run.status}`
      );

      // Get the dataset
      const dataset = await this.client.dataset(run.defaultDatasetId);

      // ✅ ONLY fetch maxItems from the dataset
      const { items } = await dataset.listItems({ limit: maxItems });

      console.log(
        `[Apify] Retrieved ${items.length} jobs (limited to ${maxItems})`
      );

      // Map the items to a consistent format
      const jobs: ApifyJob[] = items.map((item: any) => ({
        id: item.id || item.jobId || "",
        title: item.title || item.jobTitle || "",
        companyName: item.companyName || item.company || "",
        link: item.link || item.url || "",
        descriptionText: item.descriptionText || item.description || "",
        seniorityLevel: item.seniorityLevel || null,
        salary: item.salary || null,
        applicantsCount: item.applicantsCount || null,
        postedAt: item.postedAt || item.postedDate || null,
        companyLogo: item.companyLogo || null,
        location: item.location || null,
      }));

      return jobs;
    } catch (error) {
      console.error("[Apify] Scrape error:", error);
      throw new Error(
        `Apify scrape failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Check if the API key is valid by making a test call
   */
  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = new ApifyClient({ token: apiKey });
      // Try to get user info as a test
      await client.user();
      return true;
    } catch (error) {
      return false;
    }
  }
}
