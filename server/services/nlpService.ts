import { NewsItem } from '@shared/schema';
import * as fs from 'fs';
import * as path from 'path';

// Keywords for various regions
const regionKeywords: Record<string, string[]> = {
  'North America': ['us', 'usa', 'united states', 'canada', 'mexico', 'north america', 'american'],
  'Europe': ['europe', 'eu', 'european', 'uk', 'britain', 'germany', 'france', 'italy', 'spain'],
  'Asia': ['asia', 'china', 'japan', 'india', 'korea', 'hong kong', 'singapore', 'taiwan'],
  'Middle East': ['middle east', 'iran', 'iraq', 'israel', 'saudi', 'qatar', 'uae', 'dubai'],
  'Latin America': ['latin america', 'brazil', 'argentina', 'chile', 'colombia', 'peru', 'venezuela'],
  'Africa': ['africa', 'nigeria', 'egypt', 'south africa', 'kenya', 'ghana', 'ethiopia'],
  'Oceania': ['australia', 'new zealand', 'oceania', 'pacific']
};

// Keywords for various topics
const topicKeywords: Record<string, string[]> = {
  'Markets': ['stock', 'stocks', 'market', 'markets', 'index', 'indices', 'dow', 'nasdaq', 's&p', 'trading'],
  'Economy': ['economy', 'economic', 'gdp', 'inflation', 'deflation', 'recession', 'federal reserve', 'fed', 'interest rate', 'unemployment'],
  'Business': ['business', 'company', 'corporate', 'merger', 'acquisition', 'ceo', 'startup', 'enterprise'],
  'Technology': ['tech', 'technology', 'software', 'hardware', 'ai', 'artificial intelligence', 'machine learning', 'data', 'cloud', 'computing'],
  'Finance': ['finance', 'financial', 'banking', 'bank', 'investment', 'investor', 'hedge fund', 'asset', 'loan', 'credit'],
  'Politics': ['politics', 'government', 'election', 'vote', 'policy', 'regulation', 'president', 'congress', 'parliament'],
  'Health': ['health', 'healthcare', 'medical', 'medicine', 'virus', 'pandemic', 'disease', 'vaccine', 'treatment'],
  'Energy': ['energy', 'oil', 'gas', 'petroleum', 'renewable', 'solar', 'wind', 'electricity', 'nuclear'],
  'Commodities': ['commodity', 'commodities', 'gold', 'silver', 'copper', 'metal', 'agriculture', 'wheat', 'corn', 'soybean'],
  'Cryptocurrency': ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'blockchain', 'token', 'coin', 'defi', 'nft'],
  'Real Estate': ['real estate', 'property', 'housing', 'mortgage', 'commercial', 'residential', 'rent'],
  'Automotive': ['auto', 'automotive', 'car', 'vehicle', 'ev', 'electric vehicle', 'transportation']
};

/**
 * Extract region from text using keyword matching with improved confidence scoring
 * This function analyzes text content and determines the most relevant geographic region
 */
export function extractRegion(text: string): string {
  if (!text) return 'Global';
  
  const lowerText = text.toLowerCase();
  const regionScores: Record<string, number> = {};
  
  // Calculate score for each region based on keyword matches
  for (const [region, keywords] of Object.entries(regionKeywords)) {
    regionScores[region] = 0;
    
    for (const keyword of keywords) {
      // Count occurrences of the keyword
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = (lowerText.match(regex) || []).length;
      
      if (matches > 0) {
        // Add score based on matches and keyword relevance
        // Longer keywords are more specific and get higher weight
        const keywordWeight = Math.min(1, 0.5 + (keyword.length / 20));
        regionScores[region] += matches * keywordWeight;
      }
    }
  }
  
  // Find region with highest score
  let highestScore = 0;
  let highestRegion = 'Global';
  
  for (const [region, score] of Object.entries(regionScores)) {
    if (score > highestScore) {
      highestScore = score;
      highestRegion = region;
    }
  }
  
  // Only return a region if the score exceeds a minimum threshold
  return highestScore >= 0.5 ? highestRegion : 'Global';
}

/**
 * Extract topics from text using keyword matching with improved confidence scores
 * Returns an array of topics with confidence scores
 */
export function extractTopics(text: string): { topic: string, confidence: number }[] {
  if (!text) return [];
  
  const lowerText = text.toLowerCase();
  const topics: { topic: string, confidence: number }[] = [];
  
  // Calculate relevance scores for each topic
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    let totalScore = 0;
    let matchedKeywords = 0;
    
    for (const keyword of keywords) {
      // Use word boundary regex for more accurate matching
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = (lowerText.match(regex) || []).length;
      
      if (matches > 0) {
        // Calculate keyword importance by position
        // Keywords appearing in the beginning of the text have higher weight
        let positionBonus = 1.0;
        const keywordIndex = lowerText.indexOf(keyword);
        if (keywordIndex >= 0) {
          // Apply decreased weight the further the word appears in the text
          const relativePosition = keywordIndex / lowerText.length;
          positionBonus = 1.0 - (relativePosition * 0.5); // From 1.0 to 0.5 based on position
        }
        
        // Title keywords are more important - check if keyword appears in first 100 chars
        const isInTitle = lowerText.substring(0, 100).includes(keyword);
        const titleBonus = isInTitle ? 1.5 : 1.0;
        
        // Calculate score based on matches, keyword length, position and if in title
        const keywordWeight = Math.min(1.5, 0.8 + (keyword.length / 15)); // Longer keywords get more weight
        const occurrenceScore = Math.min(3, matches); // Cap multiple occurrences
        
        const keywordScore = occurrenceScore * keywordWeight * positionBonus * titleBonus;
        totalScore += keywordScore;
        matchedKeywords++;
      }
    }
    
    if (matchedKeywords > 0) {
      // Normalize the confidence score between 0 and 1
      // Topics with multiple keyword matches and higher scores rank better
      const coverage = matchedKeywords / keywords.length;
      const averageScore = totalScore / matchedKeywords;
      
      // Overall confidence combines coverage and score
      const confidence = Math.min(1, (coverage * 0.4) + (averageScore * 0.6));
      topics.push({ topic, confidence });
    }
  }
  
  // Sort by confidence (highest first)
  return topics.sort((a, b) => b.confidence - a.confidence);
}

// Predefined set of high-level categories (topics) we want to use
const PREDEFINED_CATEGORIES = [
  'Markets', 'Economy', 'Business', 'Technology', 'Finance', 
  'Politics', 'Health', 'Energy', 'Commodities', 'Cryptocurrency',
  'Real Estate', 'Automotive'
];

/**
 * Process news items with NLP to extract topics and regions
 */
export function processNewsItemWithNLP(newsItem: NewsItem): NewsItem {
  const combinedText = `${newsItem.title} ${newsItem.description || ''} ${newsItem.content || ''}`;
  
  // Extract region
  const region = extractRegion(combinedText);
  
  // Extract topics but only use our predefined set
  const extractedTopics = extractTopics(combinedText);
  
  // Filter to only include predefined categories and take top 3
  const filteredTopics = extractedTopics
    .filter(t => PREDEFINED_CATEGORIES.includes(t.topic))
    .slice(0, 3)
    .map(t => t.topic);
  
  // Set category based on highest confidence predefined topic if not already set
  let category = newsItem.category;
  if (!category && extractedTopics.length > 0) {
    // Find the highest confidence topic that is in our predefined list
    const topPredefinedTopic = extractedTopics.find(t => PREDEFINED_CATEGORIES.includes(t.topic));
    if (topPredefinedTopic) {
      category = topPredefinedTopic.topic;
    } else {
      // If no matching topic, default to "Markets"
      category = "Markets";
    }
  }
  
  return {
    ...newsItem,
    region,
    category,
    topics: filteredTopics
  };
}

/**
 * Save news data to JSON file
 */
export function saveNewsToJson(news: NewsItem[]): void {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    // Create directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const filePath = path.join(dataDir, 'news.json');
    fs.writeFileSync(filePath, JSON.stringify(news, null, 2));
    console.log(`Saved ${news.length} news items to ${filePath}`);
  } catch (error) {
    console.error('Error saving news to JSON:', error);
  }
}

/**
 * Load news data from JSON file
 */
export function loadNewsFromJson(): NewsItem[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'news.json');
    if (!fs.existsSync(filePath)) {
      console.log('No news JSON file found');
      return [];
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    const news = JSON.parse(data) as NewsItem[];
    
    // Convert date strings to Date objects
    return news.map(item => ({
      ...item,
      pubDate: new Date(item.pubDate),
      fetchedAt: new Date(item.fetchedAt)
    }));
  } catch (error) {
    console.error('Error loading news from JSON:', error);
    return [];
  }
}