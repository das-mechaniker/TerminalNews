import React from 'react';
import { useTopNews } from '@/hooks/useNews';
import { NewsItem as NewsItemType } from '@/lib/types';
import NewsItem from './NewsItem';
import { Skeleton } from '@/components/ui/skeleton';

interface TopRankedNewsProps {
  onSelectItem: (item: NewsItemType) => void;
  selectedItem: NewsItemType | null;
}

const TopRankedNews: React.FC<TopRankedNewsProps> = ({ onSelectItem, selectedItem }) => {
  const { data: topNews, isLoading, error } = useTopNews();

  if (error) {
    return (
      <div className="border-b border-[#FFBF00]">
        <div className="terminal-section-header">
          Top Ranked News
        </div>
        <div className="p-4 text-[#FF4500]">
          Error loading top news: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[#FFBF00]">
      <div className="terminal-section-header flex justify-between items-center">
        <span>Top Ranked News</span>
        <div className="flex space-x-4 text-xs">
          <span className="text-[#FFBF00]">Top News</span>
          <span className="text-[#999999]">Background & Opinion</span>
        </div>
      </div>

      <div className="flex flex-col">
        {isLoading ? (
          // Show skeletons while loading
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="news-item">
              <div className="news-id">{i+1})</div>
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
          topNews?.map((item, index) => (
            <NewsItem 
              key={item.id}
              item={item}
              index={index + 1}
              isSelected={selectedItem?.id === item.id}
              onClick={onSelectItem}
            />
          ))
        )}
      </div>

      {topNews?.length === 0 && !isLoading && (
        <div className="px-4 py-2 text-[#FFBF00]">
          No top news available at this time.
        </div>
      )}
    </div>
  );
};

export default TopRankedNews;
