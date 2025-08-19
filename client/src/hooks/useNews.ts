import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NewsItem, Filter, RefreshInterval } from "@/lib/types";
import { useState, useEffect, useCallback, useRef } from "react";
import { apiRequest } from "@/lib/queryClient";

// Hook for fetching all news
export function useAllNews(limit: number = 100) {
  const url = `/api/news?limit=${limit}`;
  return useQuery<NewsItem[]>({
    queryKey: [url],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook for fetching top ranked news
export function useTopNews(limit: number = 10) {
  const url = `/api/news/top?limit=${limit}`;
  return useQuery<NewsItem[]>({
    queryKey: [url],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch top news");
      return res.json();
    },
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
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].startsWith("/api/news"),
      });
    },
  });
}

// Hook for auto-refresh with configurable interval (database queries only, no RSS fetching)
export function useAutoRefresh(initialInterval: RefreshInterval = 60) {
  const [interval, setInterval] = useState<RefreshInterval>(initialInterval);
  const queryClient = useQueryClient();
  
  // Database-only refresh - just invalidate cache to refetch from database
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === "string" &&
        query.queryKey[0].startsWith("/api/news") &&
        !query.queryKey[0].includes("/api/news/refresh"), // Exclude refresh endpoint
    });
  }, [queryClient]);
  
  useEffect(() => {
    // Use global window object to set interval
    const intervalId: number = window.setInterval(refresh, interval * 1000);
    
    return () => window.clearInterval(intervalId);
  }, [interval, refresh]);
  
  return { interval, setInterval, refresh };
}

// Hook for initial page load: load from DB first, then trigger RSS fetch in background
export function useInitialLoad() {
  const queryClient = useQueryClient();
  const { mutate: refreshNews } = useRefreshNews();
  
  useEffect(() => {
    // On initial load, trigger a background RSS fetch after a short delay
    // This allows the initial DB queries to load first for fast UI
    const timer = setTimeout(() => {
      refreshNews(undefined, {
        onSuccess: () => {
          // After RSS fetch completes, invalidate queries to show fresh data
          queryClient.invalidateQueries({
            predicate: (query) =>
              typeof query.queryKey[0] === "string" &&
              query.queryKey[0].startsWith("/api/news") &&
              !query.queryKey[0].includes("/api/news/refresh"),
          });
        },
        onError: (error) => {
          console.error('Background RSS fetch failed:', error);
        }
      });
    }, 1000); // 1 second delay to let initial DB queries complete

    return () => clearTimeout(timer);
  }, [queryClient, refreshNews]); // Include dependencies
}
