import { 
  RssFeed, 
  InsertRssFeed, 
  NewsItem, 
  InsertNewsItem, 
  User, 
  InsertUser,
  UserPreference,
  InsertUserPreference
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // RSS Feed methods
  getAllRssFeeds(): Promise<RssFeed[]>;
  getActiveRssFeeds(): Promise<RssFeed[]>;
  getRssFeed(id: number): Promise<RssFeed | undefined>;
  createRssFeed(feed: InsertRssFeed): Promise<RssFeed>;
  updateRssFeed(id: number, feed: Partial<InsertRssFeed>): Promise<RssFeed | undefined>;
  
  // News item methods
  getNewsItems(limit?: number, offset?: number): Promise<NewsItem[]>;
  getTopRankedNews(limit?: number): Promise<NewsItem[]>;
  getNewsByProvider(provider: string, limit?: number): Promise<NewsItem[]>;
  getNewsByCategory(category: string, limit?: number): Promise<NewsItem[]>;
  getNewsItem(id: number): Promise<NewsItem | undefined>;
  createNewsItem(item: InsertNewsItem): Promise<NewsItem>;
  createNewsItems(items: InsertNewsItem[]): Promise<NewsItem[]>;
  updateNewsItem(id: number, item: Partial<NewsItem>): Promise<NewsItem | undefined>;
  getLatestNewsTimestamp(): Promise<Date | undefined>;
  getNewsByRegion(region: string, limit?: number): Promise<NewsItem[]>;
  
  // User preference methods
  getUserPreference(userId: number): Promise<UserPreference | undefined>;
  createUserPreference(pref: InsertUserPreference): Promise<UserPreference>;
  updateUserPreference(id: number, pref: Partial<InsertUserPreference>): Promise<UserPreference | undefined>;
}

// Memory Storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rssFeeds: Map<number, RssFeed>;
  private newsItems: Map<number, NewsItem>;
  private userPreferences: Map<number, UserPreference>;
  private currentUserId: number;
  private currentFeedId: number;
  private currentNewsId: number;
  private currentPrefId: number;

  constructor() {
    this.users = new Map();
    this.rssFeeds = new Map();
    this.newsItems = new Map();
    this.userPreferences = new Map();
    this.currentUserId = 1;
    this.currentFeedId = 1;
    this.currentNewsId = 1;
    this.currentPrefId = 1;
    
    // Initialize with RSS feeds from the CSV file
    this.initializeRssFeeds();
  }

  private initializeRssFeeds() {
    // These are from the provided CSV file
    const defaultFeeds = [
      { url: "https://feeds.a.dj.com/rss/RSSMarketsMain.xml", provider: "WSJ" },
      { url: "https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml", provider: "WSJ" },
      { url: "https://feeds.a.dj.com/rss/RSSWorldNews.xml", provider: "WSJ" },
      { url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", provider: "NYT" },
      { url: "https://rss.nytimes.com/services/xml/rss/nyt/Dealbook.xml", provider: "NYT" },
      { url: "https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJdEVhZXw==&_gl=1*1ffo59h*_ga*MTM1NjEyMzA0My4xNzAyMzk0NTEz*_ga_ZQWF70T3FK*MTcwMzAxODA2NS4yLjEuMTcwMzAxODExMC4xNS4wLjA.", provider: "BW" },
      { url: "https://www.huffpost.com/section/world-news/feed", provider: "HP" },
      { url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", provider: "NYT" },
      { url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", provider: "CNBC" },
      { url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147", provider: "CNBC" },
      { url: "https://www.ft.com/news-feed?format=rss.&page=1", provider: "FT" },
      { url: "https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best", provider: "RTRS" },
      { url: "https://www.capitaliq.spglobal.com/SPGMI.Services.RSSFeed.Service/RSSFeed/GetFeed/62AC1093-416D-449C-909F-04F8633DE9CE", provider: "SP" },
      { url: "https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines", provider: "MW" },
      { url: "https://feeds.content.dowjones.io/public/rss/mw_bulletins", provider: "MW" },
      { url: "https://www.feedspot.com/infiniterss.php?_src=followbtn&followfeedid=5248686&q=site:", provider: "RTRS" },
      { url: "https://www.feedspot.com/infiniterss.php?_src=feed_title&followfeedid=30964&q=site:", provider: "RTRS" },
      { url: "https://feeds.bloomberg.com/markets/news.rss", provider: "BBG" },
      { url: "https://feeds.bbci.co.uk/news/world/rss.xml#", provider: "BBC" },
      { url: "https://feeds.bbci.co.uk/news/business/rss.xml#", provider: "BBC" },
      { url: "https://www.yahoo.com/news/rss", provider: "YHOO" },
      { url: "https://api.axios.com/feed/", provider: "AXIO" },
      { url: "http://rssfeeds.usatoday.com/UsatodaycomNation-TopStories", provider: "UST" },
      { url: "https://www.wired.com/feed/category/business/latest/rss", provider: "WIRD" },
      { url: "https://www.wired.com/feed/rss", provider: "WIRD" },
      { url: "https://www.stamfordadvocate.com/rss/feed/News-1443.php", provider: "ADV" },
      { url: "https://www.feedspot.com/infiniterss.php?_src=followbtn&followfeedid=5512211&q=site:", provider: "LOCL" }
    ];

    defaultFeeds.forEach(feed => {
      const id = this.currentFeedId++;
      this.rssFeeds.set(id, {
        id,
        url: feed.url,
        provider: feed.provider,
        isActive: true
      });
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // RSS Feed methods
  async getAllRssFeeds(): Promise<RssFeed[]> {
    return Array.from(this.rssFeeds.values());
  }

  async getActiveRssFeeds(): Promise<RssFeed[]> {
    return Array.from(this.rssFeeds.values()).filter(feed => feed.isActive);
  }

  async getRssFeed(id: number): Promise<RssFeed | undefined> {
    return this.rssFeeds.get(id);
  }

  async createRssFeed(feed: InsertRssFeed): Promise<RssFeed> {
    const id = this.currentFeedId++;
    // Ensure all required properties have values
    const newFeed: RssFeed = { 
      ...feed, 
      id,
      isActive: feed.isActive ?? true 
    };
    this.rssFeeds.set(id, newFeed);
    return newFeed;
  }

  async updateRssFeed(id: number, feed: Partial<InsertRssFeed>): Promise<RssFeed | undefined> {
    const existingFeed = this.rssFeeds.get(id);
    if (!existingFeed) return undefined;
    
    const updatedFeed: RssFeed = { ...existingFeed, ...feed };
    this.rssFeeds.set(id, updatedFeed);
    return updatedFeed;
  }

  // News item methods
  async getNewsItems(limit: number = 100, offset: number = 0): Promise<NewsItem[]> {
    // Get all news items
    const allItems = Array.from(this.newsItems.values());
    
    // Get unique providers
    const providers = new Set<string>();
    allItems.forEach(item => {
      if (item.provider) {
        providers.add(item.provider);
      }
    });
    
    // Create a balanced selection from different providers
    const result: NewsItem[] = [];
    const providersArray = Array.from(providers);
    
    // Determine how many items to get from each provider
    const itemsPerProvider = Math.max(1, Math.floor(limit / providersArray.length));
    
    // Add some items from each provider
    for (const provider of providersArray) {
      const providerItems = allItems
        .filter(item => item.provider === provider)
        .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
        .slice(0, itemsPerProvider);
      
      result.push(...providerItems);
    }
    
    // Sort all items by date and apply limit and offset
    return result
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
      .slice(offset, offset + limit);
  }

  async getTopRankedNews(limit: number = 10): Promise<NewsItem[]> {
    return Array.from(this.newsItems.values())
      .filter(item => item.isTopRanked)
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
      .slice(0, limit);
  }

  async getNewsByProvider(provider: string, limit: number = 100): Promise<NewsItem[]> {
    return Array.from(this.newsItems.values())
      .filter(item => item.provider === provider)
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
      .slice(0, limit);
  }

  async getNewsByCategory(category: string, limit: number = 100): Promise<NewsItem[]> {
    return Array.from(this.newsItems.values())
      .filter(item => item.category === category)
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
      .slice(0, limit);
  }

  async getNewsItem(id: number): Promise<NewsItem | undefined> {
    return this.newsItems.get(id);
  }

  async createNewsItem(item: InsertNewsItem): Promise<NewsItem> {
    const id = this.currentNewsId++;
    // Ensure all nullable fields have appropriate values
    const newItem: NewsItem = { 
      ...item, 
      id,
      fetchedAt: new Date(),
      link: item.link ?? null,
      description: item.description ?? null,
      content: item.content ?? null,
      category: item.category ?? null,
      region: item.region ?? 'Global',
      isTopRanked: item.isTopRanked ?? false,
      sentiment: item.sentiment ?? 'neutral',
      topics: item.topics ?? [],
      originalPubDate: item.originalPubDate ?? item.pubDate,
      updatedAt: null,
      wasUpdated: false
    };
    this.newsItems.set(id, newItem);
    return newItem;
  }

  // Find news item by GUID
  async findNewsByGuid(guid: string): Promise<NewsItem | undefined> {
    return Array.from(this.newsItems.values()).find(item => item.guid === guid);
  }

  async createNewsItems(items: InsertNewsItem[]): Promise<NewsItem[]> {
    const createdItems: NewsItem[] = [];
    
    for (const item of items) {
      // Check if item already exists by GUID
      const existingItem = await this.findNewsByGuid(item.guid);
      
      if (existingItem) {
        // Update the existing item if content has changed
        if (
          existingItem.title !== item.title || 
          existingItem.description !== item.description || 
          existingItem.content !== item.content
        ) {
          // Keep track of the original publication date
          const originalPubDate = existingItem.originalPubDate || existingItem.pubDate;
          
          // Update the item
          const updatedItem = await this.updateNewsItem(existingItem.id, {
            ...item,
            originalPubDate,
            updatedAt: new Date(),
            wasUpdated: true
          });
          
          if (updatedItem) {
            createdItems.push(updatedItem);
            console.log(`Updated existing item: ${updatedItem.id} - ${updatedItem.title}`);
          }
        } else {
          // Item exists but hasn't changed, still include it in the result
          createdItems.push(existingItem);
        }
      } else {
        // Create new item
        const createdItem = await this.createNewsItem({
          ...item,
          originalPubDate: item.pubDate
        });
        createdItems.push(createdItem);
      }
    }
    
    return createdItems;
  }

  async updateNewsItem(id: number, item: Partial<NewsItem>): Promise<NewsItem | undefined> {
    const existingItem = this.newsItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem: NewsItem = { ...existingItem, ...item };
    this.newsItems.set(id, updatedItem);
    return updatedItem;
  }

  async getNewsByRegion(region: string, limit: number = 100): Promise<NewsItem[]> {
    return Array.from(this.newsItems.values())
      .filter(item => item.region === region)
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
      .slice(0, limit);
  }

  async getLatestNewsTimestamp(): Promise<Date | undefined> {
    const items = Array.from(this.newsItems.values());
    if (items.length === 0) return undefined;
    
    return items.reduce((latest, item) => {
      return item.pubDate > latest ? item.pubDate : latest;
    }, new Date(0));
  }

  // User preference methods
  async getUserPreference(userId: number): Promise<UserPreference | undefined> {
    return Array.from(this.userPreferences.values()).find(
      (pref) => pref.userId === userId
    );
  }

  async createUserPreference(pref: InsertUserPreference): Promise<UserPreference> {
    const id = this.currentPrefId++;
    // Ensure all nullable fields have appropriate values
    const newPref: UserPreference = { 
      ...pref, 
      id,
      filterCategory: pref.filterCategory ?? null,
      filterProvider: pref.filterProvider ?? null,
      refreshInterval: pref.refreshInterval ?? 60
    };
    this.userPreferences.set(id, newPref);
    return newPref;
  }

  async updateUserPreference(id: number, pref: Partial<InsertUserPreference>): Promise<UserPreference | undefined> {
    const existingPref = this.userPreferences.get(id);
    if (!existingPref) return undefined;
    
    const updatedPref: UserPreference = { ...existingPref, ...pref };
    this.userPreferences.set(id, updatedPref);
    return updatedPref;
  }
}

export const storage = new MemStorage();
