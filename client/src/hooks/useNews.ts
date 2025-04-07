import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NewsItem, Filter, RefreshInterval } from "@/lib/types";
import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";

// Hook for fetching all news
export function useAllNews(limit: number = 100) {
  return useQuery<NewsItem[]>({
    queryKey: ["/api/news", limit],
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook for fetching top ranked news
export function useTopNews(limit: number = 10) {
  return useQuery<NewsItem[]>({
    queryKey: ["/api/news/top", limit],
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook for fetching filtered news
export function useFilteredNews(filter: Filter, limit: number = 100) {
  const queryParams = new URLSearchParams();
  
  if (filter.provider) {
    queryParams.append('provider', filter.provider);
  }
  
  if (filter.category) {
    queryParams.append('category', filter.category);
  }
  
  if (filter.region) {
    queryParams.append('region', filter.region);
  }
  
  queryParams.append('limit', limit.toString());
  
  return useQuery<NewsItem[]>({
    queryKey: ["/api/news/filter", filter],
    queryFn: async ({ queryKey }) => {
      const url = `/api/news/filter?${queryParams.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch filtered news");
      return res.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook for fetching a specific news item
export function useNewsItem(id: number | null) {
  return useQuery<NewsItem>({
    queryKey: ["/api/news", id],
    queryFn: async ({ queryKey }) => {
      if (!id) throw new Error("No news item ID provided");
      const res = await fetch(`/api/news/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch news item");
      return res.json();
    },
    enabled: !!id,
  });
}

// Hook for manual refresh
export function useRefreshNews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/news/refresh", undefined);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all news queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/top"] });
      queryClient.invalidateQueries({ queryKey: ["/api/news/filter"] });
    },
  });
}

// Hook for auto-refresh with configurable interval
export function useAutoRefresh(initialInterval: RefreshInterval = 60) {
  const [interval, setInterval] = useState<RefreshInterval>(initialInterval);
  const { mutate: refreshNews } = useRefreshNews();
  
  const refresh = useCallback(() => {
    refreshNews();
  }, [refreshNews]);
  
  useEffect(() => {
    // Define a function to call refresh
    const handleRefresh = () => {
      refresh();
    };
    
    // Use global window object to set interval
    // TypeScript in Node.js environment would use NodeJS.Timeout
    // but in browser environment we use number for interval IDs
    const intervalId: number = window.setInterval(handleRefresh, interval * 1000);
    
    return () => window.clearInterval(intervalId);
  }, [interval, refresh]);
  
  return { interval, setInterval, refresh };
}
