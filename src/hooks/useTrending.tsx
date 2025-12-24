import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/firebaseConfig";

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  category: string;
}

export interface TrendingPost {
  title: string;
  url: string;
  subreddit: string;
  score: number;
  numComments: number;
  author: string;
  createdUtc: number;
  selftext: string;
  permalink: string;
}

interface TrendingResponse {
  news: NewsItem[];
  posts: TrendingPost[];
  hasMoreNews: boolean;
  hasMorePosts: boolean;
  totalNews: number;
  totalPosts: number;
  cached?: boolean;
}

export type Timeframe = "24h" | "7d" | "30d";

export const fetchTrendingData = async (
  topics: string[] = [],
  type: "all" | "news" | "posts" = "all",
  timeframe: Timeframe = "7d",
  forceRefresh: boolean = false
) => {
  const fetchTrendingFn = httpsCallable(functions, 'fetchTrending');
  const result = await fetchTrendingFn({ topics, type, page: 1, timeframe, forceRefresh });
  return result.data as TrendingResponse;
};

export function useTrending(
  topics: string[] = [],
  type: "all" | "news" | "posts" = "all",
  timeframe: Timeframe = "7d"
) {
  return useQuery({
    queryKey: ["trending", topics, type, timeframe],
    queryFn: () => fetchTrendingData(topics, type, timeframe),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useTrendingInfinite(
  topics: string[] = [],
  type: "all" | "news" | "posts" = "all",
  timeframe: Timeframe = "7d"
) {
  return useInfiniteQuery({
    queryKey: ["trending-infinite", topics, type, timeframe],
    queryFn: async ({ pageParam = 1 }) => {
      const fetchTrendingFn = httpsCallable(functions, 'fetchTrending');
      const result = await fetchTrendingFn({ topics, type, page: pageParam as number, timeframe });
      return { ...(result.data as TrendingResponse), page: pageParam as number };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const hasMore = type === "news" ? lastPage?.hasMoreNews :
        type === "posts" ? lastPage?.hasMorePosts :
          (lastPage?.hasMoreNews || lastPage?.hasMorePosts);
      return hasMore ? (lastPage?.page || 1) + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
