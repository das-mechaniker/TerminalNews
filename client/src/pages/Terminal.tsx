import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import FilterSidebar from '@/components/FilterSidebar';
import NewsContent from '@/components/NewsContent';
import { useAllNews, useAutoRefresh, useInitialLoad } from '@/hooks/useNews';
import { Filter } from '@/lib/types';
import { extractCategories, extractProviders, extractRegions } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const Terminal: React.FC = () => {
  const [filter, setFilter] = useState<Filter>({});
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const { data: allNews, isLoading } = useAllNews();
  const { refresh } = useAutoRefresh(60); // Database-only auto-refresh every 60s
  useInitialLoad(); // Load from DB first, then trigger background RSS fetch
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Extract categories, providers, and regions from the news data
  const categories = allNews ? extractCategories(allNews) : [];
  const providers = allNews ? extractProviders(allNews) : [];
  const regions = allNews ? extractRegions(allNews) : [];
  
  // Debug: Log providers to console for troubleshooting
  useEffect(() => {
    if (providers.length > 0) {
      console.log('Providers found:', providers);
    }
  }, [providers]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  // Handle filter changes
  const handleFilterChange = (newFilter: Filter) => {
    // Ensure we're creating a new object for state updates
    if (Object.keys(newFilter).length === 0) {
      // If filters are being reset, ensure we create a fresh empty object
      setFilter({});
    } else {
      setFilter({...newFilter});
    }
    
    // Show toast notification
    toast({
      title: Object.keys(newFilter).length ? "Filter Applied" : "Filters Reset",
      description: `${Object.keys(newFilter).length ? 'Filtered by ' + Object.values(newFilter).join(', ') : 'All filters cleared'}`,
      duration: 2000,
    });
  };

  // Adjust sidebar visibility for mobile on initial load
  useEffect(() => {
    if (isMobile) {
      setSidebarVisible(false);
    }
  }, [isMobile]);

  return (
    <div className="flex flex-col h-screen bg-black text-[#FFBF00]">
      <Header 
        onToggleSidebar={toggleSidebar}
        isSidebarVisible={isSidebarVisible}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <FilterSidebar
          isVisible={isSidebarVisible}
          categories={categories}
          providers={providers}
          regions={regions}
          activeFilter={filter}
          onFilterChange={handleFilterChange}
          onClose={toggleSidebar}
          className="sidebar-container"
        />
        
        <div className={`flex-1 transition-all duration-200 ${isMobile && isSidebarVisible ? 'opacity-30' : 'opacity-100'}`}>
          <NewsContent filter={filter} />
        </div>
      </div>
    </div>
  );
};

export default Terminal;
