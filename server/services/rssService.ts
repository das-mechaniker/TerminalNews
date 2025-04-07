import { InsertNewsItem, RssFeed, NewsItem } from "@shared/schema";
import * as xml2js from "xml2js";
import { storage } from "../storage";
import { processNewsItemWithNLP, saveNewsToJson } from "./nlpService";

// List of problematic feed URLs to skip or modify
const PROBLEMATIC_FEEDS = [
  'https://www.ft.com/news-feed?format=rss.&page=1',
  'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best',
  'https://www.capitaliq.spglobal.com/SPGMI.Services.RSSFeed.Service/RSSFeed/GetFeed/62AC1093-416D-449C-909F-04F8633DE9CE',
  'http://rssfeeds.usatoday.com/UsatodaycomNation-TopStories',
  'https://www.feedspot.com/infiniterss.php?_src=followbtn&followfeedid=5248686&q=site:',
  'https://www.feedspot.com/infiniterss.php?_src=feed_title&followfeedid=30964&q=site:',
  'https://www.feedspot.com/infiniterss.php?_src=followbtn&followfeedid=5512211&q=site:'
];

// Function to fix problematic feed URLs
function fixFeedUrl(url: string): string {
  // Fix URL with ampersand issues
  if (url === 'https://www.ft.com/news-feed?format=rss.&page=1') {
    return 'https://www.ft.com/news-feed?format=rss&page=1';
  }
  
  // Fix URLs with empty site parameter
  if (url.includes('&q=site:')) {
    return url.replace('&q=site:', '&q=site:example.com');
  }
  
  return url;
}

// Function to fetch and parse RSS feeds
export async function fetchAndParseRSSFeed(feed: RssFeed): Promise<InsertNewsItem[]> {
  try {
    // Skip permanently broken feeds
    if (PROBLEMATIC_FEEDS.includes(feed.url)) {
      const fixedUrl = fixFeedUrl(feed.url);
      
      // Skip this feed if we can't fix it
      if (fixedUrl === feed.url) {
        console.log(`Skipping known problematic feed: ${feed.url}`);
        return [];
      }
      
      // Use the fixed URL instead
      feed = { ...feed, url: fixedUrl };
    }

    const response = await fetch(feed.url, {
      // Add timeout to prevent hanging on problematic feeds
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch feed ${feed.url}: ${response.statusText}`);
      return [];
    }

    const xml = await response.text();
    
    // Pre-process XML to fix common issues
    const cleanedXml = xml
      // Remove invalid ampersands in URLs (common issue)
      .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g, '&amp;')
      // Fix unquoted attributes (common issue)
      .replace(/=([^"'][^ >]*)/g, '="$1"');
    
    const parser = new xml2js.Parser({ 
      explicitArray: false,
      // More lenient parsing options
      strict: false,
      normalizeTags: true,
      trim: true
    });
    
    const result = await parser.parseStringPromise(cleanedXml);

    // Handle different RSS formats
    if (!result.rss && result.feed) {
      // Handle Atom feeds
      let items = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];
      return parseAtomItems(items, feed);
    } else if (!result.rss || !result.rss.channel || !result.rss.channel.item) {
      console.error(`Invalid RSS format for feed ${feed.url}`);
      return [];
    }

    let items = Array.isArray(result.rss.channel.item) 
      ? result.rss.channel.item 
      : [result.rss.channel.item];

    // Map RSS items to our schema
    return items.map((item: any) => {
      const pubDate = new Date(item.pubDate || item.pubdate || new Date());
      
      // Determine if this is a top news item (simple algorithm - could be improved)
      // Here we're just making recent news from certain providers top ranked
      const isTopRanked = pubDate > new Date(Date.now() - 3600000) && 
                          ['BBG', 'WSJ', 'RTRS', 'CNBC'].includes(feed.provider);

      // Extract category if available
      let category = 'general';
      if (item.category) {
        if (Array.isArray(item.category)) {
          category = item.category[0];
        } else if (typeof item.category === 'object' && item.category._) {
          category = item.category._;
        } else {
          category = item.category;
        }
      }

      // Simple sentiment analysis (basic implementation)
      let sentiment = 'neutral';
      const title = (item.title || '').toLowerCase();
      
      const positiveWords = ['surge', 'rise', 'gain', 'jump', 'positive', 'up', 'high', 'soar'];
      const negativeWords = ['fall', 'drop', 'decline', 'negative', 'down', 'low', 'plunge', 'plummet'];
      
      if (positiveWords.some(word => title.includes(word))) {
        sentiment = 'positive';
      } else if (negativeWords.some(word => title.includes(word))) {
        sentiment = 'negative';
      }

      return {
        title: item.title || 'No Title',
        description: item.description || '',
        content: item['content:encoded'] || item.content || item.description || '',
        link: item.link?.href || item.link || '',
        guid: item.guid?._ || item.guid || item.id || item.link || String(Date.now()),
        pubDate,
        feedId: feed.id,
        provider: feed.provider,
        isTopRanked,
        sentiment,
        category
      };
    });
  } catch (error) {
    console.error(`Error fetching/parsing feed ${feed.url}:`, error);
    return [];
  }
}

// Parse Atom feed items
function parseAtomItems(items: any[], feed: RssFeed): InsertNewsItem[] {
  return items.map(item => {
    const pubDate = new Date(item.updated || item.published || new Date());
    
    const isTopRanked = pubDate > new Date(Date.now() - 3600000) && 
                        ['BBG', 'WSJ', 'RTRS', 'CNBC'].includes(feed.provider);

    let category = 'general';
    if (item.category) {
      if (Array.isArray(item.category)) {
        category = item.category[0].term || item.category[0] || 'general';
      } else {
        category = item.category.term || item.category || 'general';
      }
    }

    let sentiment = 'neutral';
    const title = (item.title || '').toLowerCase();
    
    const positiveWords = ['surge', 'rise', 'gain', 'jump', 'positive', 'up', 'high', 'soar'];
    const negativeWords = ['fall', 'drop', 'decline', 'negative', 'down', 'low', 'plunge', 'plummet'];
    
    if (positiveWords.some(word => title.includes(word))) {
      sentiment = 'positive';
    } else if (negativeWords.some(word => title.includes(word))) {
      sentiment = 'negative';
    }

    return {
      title: item.title || 'No Title',
      description: item.summary || '',
      content: item.content || item.summary || '',
      link: item.link?.href || (typeof item.link === 'string' ? item.link : ''),
      guid: item.id || String(Date.now()),
      pubDate,
      feedId: feed.id,
      provider: feed.provider,
      isTopRanked,
      sentiment,
      category
    };
  });
}

// Function to fetch all active RSS feeds and update the news database
export async function updateNewsFromRssFeeds(): Promise<number> {
  try {
    // Get all active RSS feeds
    const feeds = await storage.getActiveRssFeeds();
    if (!feeds.length) {
      console.log('No active RSS feeds to process');
      return 0;
    }

    let newItemsCount = 0;
    let updatedItemsCount = 0;
    
    // Process each feed
    for (const feed of feeds) {
      const items = await fetchAndParseRSSFeed(feed);
      
      if (items.length > 0) {
        // Store items in the database - the storage layer will handle duplicates now
        const createdItems = await storage.createNewsItems(items);
        
        // Count how many were new vs updated
        const updatedItems = createdItems.filter(item => item.wasUpdated);
        const newItems = createdItems.filter(item => !item.wasUpdated);
        
        // Process items with NLP for topic and region extraction
        const processedItems = createdItems.map(item => processNewsItemWithNLP(item));
        
        // Update items in storage with processed data
        for (const item of processedItems) {
          // No need to await these updates, they can happen asynchronously
          storage.updateNewsItem(item.id, {
            category: item.category,
            region: item.region,
            topics: item.topics
          });
        }
        
        updatedItemsCount += updatedItems.length;
        newItemsCount += newItems.length;
        
        if (newItems.length > 0) {
          console.log(`Added ${newItems.length} new items from ${feed.provider}`);
        }
        
        if (updatedItems.length > 0) {
          console.log(`Updated ${updatedItems.length} existing items from ${feed.provider}`);
        }
      }
    }

    // Save all news items to JSON file for persistence
    const allNewsItems = await storage.getNewsItems(1000); // Get latest 1000 items
    saveNewsToJson(allNewsItems);

    console.log(`Total new items added: ${newItemsCount}, Updated items: ${updatedItemsCount}`);
    return newItemsCount;
  } catch (error) {
    console.error('Error updating news from RSS feeds:', error);
    return 0;
  }
}
