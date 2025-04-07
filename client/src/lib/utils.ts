import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { NewsItem } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a date for display
export function formatDate(date: string | Date | null): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm');
}

// Format a date relative to now
export function formatRelativeDate(date: string | Date | null): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

// Get appropriate color class based on sentiment - using Bloomberg terminal-like colors
export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive':
      return 'text-[#4DAF4A]'; // Green - less bright, closer to Bloomberg green
    case 'negative':
      return 'text-[#E41A1C]'; // Red - closer to Bloomberg red
    case 'neutral':
    default:
      return 'text-[#F5F5F5]'; // Default white - neutral news in Bloomberg
  }
}

// Format news provider abbreviation
export function formatProvider(provider: string): string {
  return provider.toUpperCase();
}

// Truncate text to a specified length
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Sort news items by time
export function sortNewsByTime(news: NewsItem[]): NewsItem[] {
  return [...news].sort((a, b) => {
    return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
  });
}

// Sort news items by ID (for terminal-style display)
export function sortNewsById(news: NewsItem[]): NewsItem[] {
  return [...news].sort((a, b) => a.id - b.id);
}

// Extract categories from news items
export function extractCategories(news: NewsItem[]): string[] {
  const categories = new Set<string>();
  
  // Use only our predefined high-level categories
  const predefinedCategories = [
    'Markets', 'Economy', 'Business', 'Technology', 'Finance', 
    'Politics', 'Health', 'Energy', 'Commodities', 'Cryptocurrency',
    'Real Estate', 'Automotive'
  ];
  
  // First add all predefined categories
  predefinedCategories.forEach(category => categories.add(category));
  
  // Then add categories from news items, but only if they're in our predefined list
  news.forEach(item => {
    if (item.category && typeof item.category === 'string') {
      // Check if this category is in our predefined list (case-sensitive)
      if (predefinedCategories.includes(item.category.trim())) {
        categories.add(item.category.trim());
      }
    }
  });
  
  // Return sorted array
  return Array.from(categories).sort((a, b) => a.localeCompare(b));
}

// Extract providers from news items
export function extractProviders(news: NewsItem[]): string[] {
  console.log('Extracting providers from', news.length, 'news items');
  
  // Track unique providers and their counts for debugging
  const providerCounts: Record<string, number> = {};
  
  const providers = new Set<string>();
  news.forEach(item => {
    if (item.provider) {
      providers.add(item.provider);
      
      // Count for debugging
      providerCounts[item.provider] = (providerCounts[item.provider] || 0) + 1;
    }
  });
  
  // Log counts for debugging
  console.log('Provider counts:', providerCounts);
  
  // Return sorted array
  return Array.from(providers).sort();
}

// Extract regions from news items
export function extractRegions(news: NewsItem[]): string[] {
  const regions = new Set<string>();
  
  // Include default regions that should always be available
  const defaultRegions = [
    'Global', 'North America', 'Europe', 'Asia', 
    'Middle East', 'Latin America', 'Africa', 'Oceania'
  ];
  
  // Add default regions
  defaultRegions.forEach(region => regions.add(region));
  
  // Add regions from news items
  news.forEach(item => {
    if (item.region && typeof item.region === 'string' && item.region.trim()) {
      regions.add(item.region.trim());
    }
  });
  
  // Return sorted array with Global first
  return Array.from(regions).sort((a, b) => {
    if (a === 'Global') return -1;
    if (b === 'Global') return 1;
    return a.localeCompare(b);
  });
}

// Get region display name with icons
export function getRegionDisplayName(region: string): string {
  const regionIcons: Record<string, string> = {
    'Global': '🌐',
    'North America': '🌎',
    'Europe': '🇪🇺',
    'Asia': '🌏',
    'Middle East': '🕌',
    'Latin America': '🌴',
    'Africa': '🌍',
    'Oceania': '🏝️'
  };
  
  const icon = regionIcons[region] || '';
  return icon ? `${icon} ${region}` : region;
}

// Get color for region
export function getRegionColor(region: string): string {
  const regionColors: Record<string, string> = {
    'Global': 'text-slate-100',
    'North America': 'text-blue-300',
    'Europe': 'text-yellow-300', 
    'Asia': 'text-red-300',
    'Middle East': 'text-emerald-300',
    'Latin America': 'text-orange-300',
    'Africa': 'text-purple-300',
    'Oceania': 'text-teal-300'
  };
  
  return regionColors[region] || 'text-slate-100';
}
