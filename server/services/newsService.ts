import { storage } from "../storage";
import { updateNewsFromRssFeeds } from "./rssService";
import { NewsItem } from "@shared/schema";

// Initialize news fetch interval in milliseconds (default: 5 minutes)
const NEWS_FETCH_INTERVAL = 5 * 60 * 1000;

// Initialize the news fetching service
let newsUpdateInterval: NodeJS.Timeout | null = null;

export function startNewsUpdateService() {
  if (newsUpdateInterval) {
    clearInterval(newsUpdateInterval);
  }

  // Initial fetch
  updateNewsFromRssFeeds().catch(err => {
    console.error('Error in initial news fetch:', err);
  });

  // Set up periodic updates
  newsUpdateInterval = setInterval(async () => {
    try {
      await updateNewsFromRssFeeds();
    } catch (error) {
      console.error('Error in scheduled news fetch:', error);
    }
  }, NEWS_FETCH_INTERVAL);

  console.log(`News update service started, fetching every ${NEWS_FETCH_INTERVAL / 60000} minutes`);
  return newsUpdateInterval;
}

export function stopNewsUpdateService() {
  if (newsUpdateInterval) {
    clearInterval(newsUpdateInterval);
    newsUpdateInterval = null;
    console.log('News update service stopped');
  }
}

export async function getLatestNews(limit: number = 100): Promise<NewsItem[]> {
  return storage.getNewsItems(limit);
}

export async function getTopRankedNews(limit: number = 10): Promise<NewsItem[]> {
  return storage.getTopRankedNews(limit);
}

export async function getNewsDetails(id: number): Promise<NewsItem | undefined> {
  return storage.getNewsItem(id);
}

export async function getFilteredNews(options: {
  provider?: string;
  category?: string;
  region?: string;
  limit?: number;
}): Promise<NewsItem[]> {
  const { provider, category, region, limit = 100 } = options;
  
  if (provider) {
    return storage.getNewsByProvider(provider, limit);
  }
  
  if (category) {
    return storage.getNewsByCategory(category, limit);
  }
  
  if (region) {
    return storage.getNewsByRegion(region, limit);
  }
  
  return storage.getNewsItems(limit);
}
