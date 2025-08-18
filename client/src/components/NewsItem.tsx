import React from 'react';
import { NewsItem as NewsItemType } from '@/lib/types';
import { formatDate, getSentimentColor, getRegionColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Clock, RefreshCw } from 'lucide-react';

interface NewsItemProps {
  item: NewsItemType;
  index: number;
  isSelected: boolean;
  onClick: (item: NewsItemType) => void;
}

const NewsItem: React.FC<NewsItemProps> = ({ item, index, isSelected, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    // Check if Command key (Mac) or Ctrl key (Windows/Linux) is pressed
    if (e.metaKey || e.ctrlKey) {
      // Open the news source link in a new tab
      if (item.link) {
        window.open(item.link, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    
    console.log("NewsItem clicked:", item.id, item.title);
    onClick(item);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Enter and Space key presses
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Check if Command key (Mac) or Ctrl key (Windows/Linux) is pressed
      if (e.metaKey || e.ctrlKey) {
        // Open the news source link in a new tab
        if (item.link) {
          window.open(item.link, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      onClick(item);
    }
  };
  
  // Determine if the item has been updated
  const isUpdated = item.wasUpdated && item.updatedAt;
  
  return (
    <div 
      className={cn(
        "news-item cursor-pointer",
        isSelected && "bg-[#1a1a1a]",
        isSelected && "border-l-2 border-l-[#FFBF00]"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`News item: ${item.title}. Command+Click to open in new tab.`}
    >
      <div className="news-id text-[#FFBF00]">
        {index})
      </div>
      <div className={cn("news-title", getSentimentColor(item.sentiment))}>
        {item.title}
      </div>
      <div className="news-metadata">
        <div className="news-provider">{item.provider}</div>
        {item.region && (
          <div className={cn("news-region", getRegionColor(item.region))}>
            {item.region}
          </div>
        )}
        <div className="news-time">
          {isUpdated ? (
            <span title={`Originally published: ${formatDate(item.originalPubDate || item.pubDate)}`}>
              <span className="mr-1 text-green-400">
                <RefreshCw size={12} className="inline-block" />
              </span>
              Updated: {item.updatedAt ? formatDate(item.updatedAt) : ''}
            </span>
          ) : (
            formatDate(item.pubDate)
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(NewsItem);
