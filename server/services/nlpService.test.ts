import { describe, it, expect } from 'vitest';
import { extractRegion, extractTopics, processNewsItemWithNLP } from './nlpService';
import type { NewsItem } from '@shared/schema';

describe('extractRegion', () => {
  it('detects North America from US-related text', () => {
    const text = 'US stocks rally as Federal Reserve cuts rates';
    expect(extractRegion(text)).toBe('North America');
  });

  it('returns Global for empty text', () => {
    expect(extractRegion('')).toBe('Global');
  });

  it('selects region with highest score when keywords overlap', () => {
    const text = 'Mexico and Canada strengthen ties with Brazil';
    expect(extractRegion(text)).toBe('North America');
  });
});

describe('extractTopics', () => {
  it('identifies market and crypto topics', () => {
    const text = 'Stock market rallies while bitcoin price jumps';
    const topics = extractTopics(text).map(t => t.topic);
    expect(topics).toContain('Markets');
    expect(topics).toContain('Cryptocurrency');
  });

  it('returns empty array for empty text', () => {
    expect(extractTopics('')).toEqual([]);
  });

  it('handles overlapping keywords across topics', () => {
    const text = 'Investors fear stock and crypto markets crash';
    const topics = extractTopics(text).map(t => t.topic);
    expect(topics).toContain('Markets');
    expect(topics).toContain('Cryptocurrency');
  });
});

describe('processNewsItemWithNLP', () => {
  it('enriches news item with region, category, and topics', () => {
    const item = {
      title: 'US stock market soars as bitcoin surges',
      description: 'Investors in the United States celebrate gains in cryptocurrency.',
      content: '',
      guid: '1',
      pubDate: new Date(),
      feedId: 1,
      provider: 'Test Source'
    } as unknown as NewsItem;

    const processed = processNewsItemWithNLP(item);
    expect(processed.region).toBe('North America');
    expect(processed.category).toBe('Markets');
    expect(processed.topics).toContain('Markets');
    expect(processed.topics).toContain('Cryptocurrency');
  });

  it('handles empty text gracefully', () => {
    const item = {
      title: '',
      description: '',
      content: '',
      guid: '2',
      pubDate: new Date(),
      feedId: 1,
      provider: 'Test Source'
    } as unknown as NewsItem;

    const processed = processNewsItemWithNLP(item);
    expect(processed.region).toBe('Global');
    expect(processed.topics).toEqual([]);
    expect(processed.category).toBeUndefined();
  });
});
