import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { startNewsUpdateService, getLatestNews, getTopRankedNews, getNewsDetails, getFilteredNews } from "./services/newsService";
import { z } from "zod";

const newsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

const topNewsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(10),
});

const filteredNewsQuerySchema = z.object({
  provider: z.string().optional(),
  category: z.string().optional(),
  region: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the news update service when the server starts
  startNewsUpdateService();

  // Get all RSS feeds
  app.get("/api/feeds", async (_req: Request, res: Response) => {
    try {
      const feeds = await storage.getActiveRssFeeds();
      res.json(feeds);
    } catch (error) {
      console.error("Error fetching RSS feeds:", error);
      res.status(500).json({ message: "Error fetching RSS feeds" });
    }
  });

  // Get all news items (with pagination)
  app.get("/api/news", async (req: Request, res: Response) => {
    try {
      const parsed = newsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }
      const { limit, offset } = parsed.data;

      const news = await storage.getNewsItems(limit, offset);
      
      // Debug: Log unique providers in the API response
      const uniqueProviders = [...new Set(news.map(item => item.provider))].sort();
      console.log("API: Returning news with providers:", uniqueProviders);
      
      res.json(news);
    } catch (error) {
      console.error("Error fetching news items:", error);
      res.status(500).json({ message: "Error fetching news items" });
    }
  });

  // Get top ranked news
  app.get("/api/news/top", async (req: Request, res: Response) => {
    try {
      const parsed = topNewsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }
      const { limit } = parsed.data;
      const topNews = await getTopRankedNews(limit);
      res.json(topNews);
    } catch (error) {
      console.error("Error fetching top news:", error);
      res.status(500).json({ message: "Error fetching top news" });
    }
  });

  // Get filtered news
  app.get("/api/news/filter", async (req: Request, res: Response) => {
    try {
      const parsed = filteredNewsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.message });
      }
      const { provider, category, region, limit } = parsed.data;

      const filteredNews = await getFilteredNews({
        provider,
        category,
        region,
        limit,
      });

      res.json(filteredNews);
    } catch (error) {
      console.error("Error fetching filtered news:", error);
      res.status(500).json({ message: "Error fetching filtered news" });
    }
  });

  // Get a specific news item by ID
  app.get("/api/news/:id", async (req: Request, res: Response) => {
    try {
      const idSchema = z.number().int().positive();
      const id = idSchema.parse(parseInt(req.params.id));
      
      console.log(`Fetching news item with id: ${id}`);
      const newsItem = await getNewsDetails(id);
      
      if (!newsItem) {
        console.log(`News item with id ${id} not found`);
        return res.status(404).json({ message: "News item not found" });
      }
      
      console.log(`Successfully fetched news item: ${newsItem.id} - ${newsItem.title}`);
      res.json(newsItem);
    } catch (error) {
      console.error("Error fetching news item:", error);
      res.status(500).json({ message: "Error fetching news item" });
    }
  });

  // Trigger manual refresh of news
  app.post("/api/news/refresh", async (_req: Request, res: Response) => {
    try {
      const newsUpdateService = await import("./services/rssService");
      const newItemsCount = await newsUpdateService.updateNewsFromRssFeeds();
      res.json({ message: `Successfully refreshed news feed. Added ${newItemsCount} new items.` });
    } catch (error) {
      console.error("Error refreshing news:", error);
      res.status(500).json({ message: "Error refreshing news" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
