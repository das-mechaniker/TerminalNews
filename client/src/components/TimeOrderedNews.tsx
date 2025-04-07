import React from 'react';
import { useFilteredNews } from '@/hooks/useNews';
import { NewsItem as NewsItemType, Filter } from '@/lib/types';
import NewsItem from './NewsItem';
import { Skeleton } from '@/components/ui/skeleton';

interface TimeOrderedNewsProps {
  filter: Filter;
  onSelectItem: (item: NewsItemType) => void;
  selectedItem: NewsItemType | null;
  topNewsCount: number;
}

const TimeOrderedNews: React.FC<TimeOrderedNewsProps> = ({ 
  filter, 
  onSelectItem, 
  selectedItem,
  topNewsCount 
}) => {
  const { data: news, isLoading, error } = useFilteredNews(filter);

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="terminal-section-header">
          Time Ordered News
        </div>
        <div className="p-4 text-[#FF4500]">
          Error loading news: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="terminal-section-header">
        <span>Time Ordered News</span>
        {Object.keys(filter).length > 0 && (
          <span className="ml-2 text-xs font-normal">
            ({filter.provider || ''} {filter.category || ''})
          </span>
        )}
      </div>

      <div className="flex flex-col overflow-auto">
        {isLoading ? (
          // Show skeletons while loading
          Array(10).fill(0).map((_, i) => (
            <div key={i} className="news-item">
              <div className="news-id">{i + topNewsCount + 1})</div>
              <Skeleton className="h-3.5 w-full bg-gray-800" />
              <div className="news-provider">
                <Skeleton className="h-3.5 w-10 bg-gray-800" />
              </div>
              <div className="news-time">
                <Skeleton className="h-3.5 w-10 bg-gray-800" />
              </div>
            </div>
          ))
        ) : (
          news?.map((item, index) => (
            <NewsItem 
              key={item.id}
              item={item}
              index={index + topNewsCount + 1}
              isSelected={selectedItem?.id === item.id}
              onClick={onSelectItem}
            />
          ))
        )}
      </div>

      {news?.length === 0 && !isLoading && (
        <div className="px-4 py-2 text-[#FFBF00]">
          No news available with the current filters.
        </div>
      )}
    </div>
  );
};

export default TimeOrderedNews;
