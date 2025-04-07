import React, { useState, useEffect } from 'react';
import TopRankedNews from './TopRankedNews';
import TimeOrderedNews from './TimeOrderedNews';
import NewsDetails from './NewsDetails';
import { NewsItem, Filter } from '@/lib/types';
import { useTopNews } from '@/hooks/useNews';

interface NewsContentProps {
  filter: Filter;
}

const NewsContent: React.FC<NewsContentProps> = ({ filter }) => {
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const { data: topNews } = useTopNews();
  
  // Reset selected item when filter changes
  useEffect(() => {
    setSelectedItem(null);
  }, [filter]);

  // Handle selecting a news item
  const handleSelectItem = (item: NewsItem) => {
    console.log("Selected item:", item.id, item.title);
    setSelectedItem(item);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <div className={`flex-1 overflow-auto ${selectedItem ? 'news-list-with-details' : 'h-full'}`}>
        {/* Top Ranked News Section */}
        <TopRankedNews
          onSelectItem={handleSelectItem}
          selectedItem={selectedItem}
        />
        
        {/* Time Ordered News Section */}
        <TimeOrderedNews
          filter={filter}
          onSelectItem={handleSelectItem}
          selectedItem={selectedItem}
          topNewsCount={topNews?.length || 0}
        />
      </div>
      
      {/* News Details Section - only rendered when an item is selected */}
      {selectedItem && (
        <div className="news-details-wrapper">
          <NewsDetails
            selectedItemId={selectedItem.id}
          />
        </div>
      )}
    </div>
  );
};

export default NewsContent;
