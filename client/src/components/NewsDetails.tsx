import React from 'react';
import { useNewsItem } from '@/hooks/useNews';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatDate, getRegionColor, getRegionDisplayName } from '@/lib/utils';
import DOMPurify from 'dompurify';

interface NewsDetailsProps {
  selectedItemId: number | null;
  className?: string;
}

export const sanitizeHtml = (html: string) => DOMPurify.sanitize(html);

const NewsDetails: React.FC<NewsDetailsProps> = ({ selectedItemId, className }) => {
  console.log("NewsDetails rendered with selectedItemId:", selectedItemId);
  const { data: newsItem, isLoading, error } = useNewsItem(selectedItemId);

  // Log data from the API
  React.useEffect(() => {
    if (newsItem) {
      console.log("NewsDetails loaded data:", newsItem.id, newsItem.title);
    }
  }, [newsItem]);

  // Don't render anything if no item is selected
  if (!selectedItemId) {
    return null;
  }

  if (error) {
    return (
      <div className={cn("news-details-container", className)}>
        <div className="terminal-section-header flex justify-between items-center py-1">
          <span>News Details</span>
          <span className="text-[#999999]">TERM/NEWS</span>
        </div>
        <div className="text-[#E41A1C] p-2">
          Error loading news details: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn("news-details-container", className)}>
        <div className="terminal-section-header flex justify-between items-center py-1">
          <span>News Details</span>
          <span className="text-[#999999]">TERM/NEWS</span>
        </div>
        <div className="p-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24 bg-gray-800" />
            <Skeleton className="h-4 w-12 bg-gray-800" />
          </div>
          <div className="mt-2">
            <Skeleton className="h-5 w-3/4 bg-gray-800" />
            <Skeleton className="h-3 w-full mt-2 bg-gray-800" />
            <Skeleton className="h-3 w-full mt-1 bg-gray-800" />
            <Skeleton className="h-3 w-3/4 mt-1 bg-gray-800" />
          </div>
        </div>
      </div>
    );
  }

  // Sanitize HTML content before rendering
  const sanitizedContent = newsItem?.content ? sanitizeHtml(newsItem.content) : '';
  const sanitizedDescription = newsItem?.description ? sanitizeHtml(newsItem.description) : '';
  const createMarkup = (html: string) => ({ __html: html });

  // Smart content selection: prefer content over description, but avoid duplication
  const hasContent = sanitizedContent && sanitizedContent.trim().length > 0;
  const hasDescription = sanitizedDescription && sanitizedDescription.trim().length > 0;
  
  // Check if description and content are essentially the same (strip HTML and compare)
  const descriptionText = sanitizedDescription.replace(/<[^>]*>/g, '').trim();
  const contentText = sanitizedContent.replace(/<[^>]*>/g, '').trim();
  const areContentsSimilar = descriptionText && contentText && 
    (descriptionText === contentText || contentText.includes(descriptionText));

  // Display logic: show content if available, otherwise description, but not both if similar
  const shouldShowContent = hasContent;
  const shouldShowDescription = hasDescription && !areContentsSimilar && !hasContent;

  return (
    <div className={cn("news-details-container", className)}>
      <div className="terminal-section-header flex justify-between items-center py-1 px-2">
        <span>News Details</span>
        <span className="text-[#999999]">TERM/NEWS {newsItem?.id || ''}</span>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between mb-2">
          <div className="flex items-center">
            <span className="text-[#4F94CD] font-bold mr-2">{newsItem?.category || 'News'}</span>
            {newsItem?.region && (
              <span className={cn("px-1 rounded", getRegionColor(newsItem.region))}>
                {getRegionDisplayName(newsItem.region)}
              </span>
            )}
          </div>
          <div className="text-right">
            {newsItem?.wasUpdated && newsItem?.updatedAt ? (
              <div>
                <div className="text-green-400 flex items-center justify-end">
                  <span className="mr-1">UPDATED:</span>
                  <span>{formatDate(newsItem.updatedAt)}</span>
                </div>
                <div className="text-[#999999] text-xs">
                  <span>Originally published: {formatDate(newsItem.originalPubDate || newsItem.pubDate)}</span>
                </div>
              </div>
            ) : (
              <span className="text-[#999999]">{newsItem ? formatDate(newsItem.pubDate) : ''}</span>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="news-details-title">{newsItem?.title}</h2>
          
          {/* Show description only if there's no content or they're different */}
          {shouldShowDescription && (
            <div className="news-details-description">
              <div className="leading-tight" dangerouslySetInnerHTML={createMarkup(sanitizedDescription)} />
            </div>
          )}
          
          {/* Source information */}
          <div className="flex items-center mb-2">
            <span className="text-[#4F94CD] mr-1 font-bold">SRC:</span>
            <span className="text-[#BBBBBB]">{newsItem?.provider}</span>
            {newsItem?.link && (
              <>
                <span className="mx-1 text-[#666666]">|</span>
                <a 
                  href={newsItem.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#FFBF00] hover:underline"
                >
                  LINK
                </a>
              </>
            )}
          </div>
          
          {/* Content (prefer this over description) */}
          {shouldShowContent && (
            <div className="news-details-content">
              <div className="leading-tight" dangerouslySetInnerHTML={createMarkup(sanitizedContent)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsDetails;
