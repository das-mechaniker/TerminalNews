export interface RssFeed {
  id: number;
  url: string;
  provider: string;
  isActive: boolean;
}

export interface NewsItem {
  id: number;
  title: string;
  description: string | null;
  content: string | null;
  link: string | null;
  guid: string;
  pubDate: string; // ISO date string
  originalPubDate: string | null; // ISO date string for the original publication date
  feedId: number;
  provider: string;
  isTopRanked: boolean;
  sentiment: string;
  category: string | null;
  region: string | null;
  fetchedAt: string; // ISO date string
  updatedAt: string | null; // ISO date string for when the article was updated
  wasUpdated: boolean; // Flag indicating if this article was updated since original publication
}

export type Filter = {
  provider?: string;
  category?: string;
  region?: string;
};

export type RefreshInterval = 15 | 30 | 60 | 300 | 600;
