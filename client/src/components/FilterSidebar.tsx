import React from 'react';
import { Filter } from '@/lib/types';
import { cn, getRegionDisplayName, getRegionColor } from '@/lib/utils';

// Helper function to format category names for display
function formatCategoryName(category: string): string {
  if (!category) return 'General';
  
  // Capitalize first letter of each word
  return category
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

interface FilterSidebarProps {
  isVisible: boolean;
  categories: string[];
  providers: string[];
  regions: string[];
  activeFilter: Filter;
  onFilterChange: (filter: Filter) => void;
  onClose: () => void;
  className?: string;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isVisible,
  categories = [],
  providers = [],
  regions = [],
  activeFilter,
  onFilterChange,
  onClose,
  className
}) => {
  // Handle category selection - exclusive filter
  const handleCategorySelect = (category: string) => {
    // If the same category is clicked again, clear the filter
    if (activeFilter.category === category) {
      onFilterChange({});
    } else {
      // Only set the category filter, clear any other filters
      onFilterChange({ category });
    }
  };

  // Handle provider selection - exclusive filter
  const handleProviderSelect = (provider: string) => {
    // If the same provider is clicked again, clear the filter
    if (activeFilter.provider === provider) {
      onFilterChange({});
    } else {
      // Only set the provider filter, clear any other filters
      onFilterChange({ provider });
    }
  };
  
  // Handle region selection - exclusive filter
  const handleRegionSelect = (region: string) => {
    // If the same region is clicked again, clear the filter
    if (activeFilter.region === region) {
      onFilterChange({});
    } else {
      // Only set the region filter, clear any other filters
      onFilterChange({ region });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    // Make sure we're fully resetting by creating a new empty object
    onFilterChange({});
  };

  // Safety check for filters that might be objects
  const safeCategories = categories.filter(item => typeof item === 'string');
  const safeProviders = providers.filter(item => typeof item === 'string');
  const safeRegions = regions.filter(item => typeof item === 'string');

  return (
    <div className={cn(
      "min-w-fit border-r border-[#FFBF00] overflow-y-auto h-full bg-black",
      isVisible ? "" : "hidden",
      className
    )}>
      <div className="terminal-section-header flex justify-between items-center text-xs py-1 px-2">
        <span>Filter Settings</span>
        <button 
          className="text-[#FFBF00] hover:text-white" 
          onClick={onClose}
          aria-label="Close filters"
        >
          ×
        </button>
      </div>
      
      {/* Action Buttons */}
      <div className="px-2 py-1 border-b border-[#333] flex justify-between text-xs">
        <button 
          className="text-[#4F94CD] hover:text-white"
          onClick={clearFilters}
          aria-label="Reset filters"
        >
          RESET ALL
        </button>
        <span className="text-[#999999]">F10=ADV</span>
      </div>
      
      {/* Filter by Provider */}
      <div className="terminal-section-header text-xs px-2">
        <span>NEWS PROVIDERS</span>
      </div>
      <div className="filter-sidebar-list border-b border-[#333]">
        {safeProviders.map((provider, index) => (
          <div 
            key={`provider-${provider}-${index}`}
            className={cn(
              "filter-item text-xs",
              { 
                "bg-[#1a1a1a]": activeFilter.provider === provider,
                "text-[#FFBF00]": activeFilter.provider === provider,
                "text-[#F5F5F5]": activeFilter.provider !== provider 
              }
            )}
            onClick={() => handleProviderSelect(provider)}
          >
            <span>{provider}</span>
            {activeFilter.provider === provider && <span className="ml-1">►</span>}
          </div>
        ))}
      </div>
      
      {/* Filter by Category */}
      <div className="terminal-section-header text-xs px-2">
        <span>TOPICS</span>
      </div>
      <div className="filter-sidebar-list border-b border-[#333]">
        {safeCategories.map((category, index) => (
          <div 
            key={`category-${category}-${index}`}
            className={cn(
              "filter-item text-xs",
              { 
                "bg-[#1a1a1a]": activeFilter.category === category,
                "text-[#FFBF00]": activeFilter.category === category,
                "text-[#F5F5F5]": activeFilter.category !== category
              }
            )}
            onClick={() => handleCategorySelect(category)}
          >
            <span>{formatCategoryName(category)}</span>
            {activeFilter.category === category && <span className="ml-1">►</span>}
          </div>
        ))}
      </div>
      
      {/* Filter by Region */}
      <div className="terminal-section-header text-xs px-2">
        <span>REGIONS</span>
      </div>
      <div className="filter-sidebar-list">
        {safeRegions.map((region, index) => (
          <div 
            key={`region-${region}-${index}`}
            className={cn(
              "filter-item text-xs flex items-center",
              { 
                "bg-[#1a1a1a]": activeFilter.region === region,
                [activeFilter.region === region ? "text-[#FFBF00]" : getRegionColor(region)]: true
              }
            )}
            onClick={() => handleRegionSelect(region)}
          >
            <span>{getRegionDisplayName(region)}</span>
            {activeFilter.region === region && <span className="ml-1">►</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterSidebar;
