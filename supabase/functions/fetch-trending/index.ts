import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// RSS Feed sources for tech/business news
const RSS_FEEDS = [
  { name: "TechCrunch", url: "https://techcrunch.com/feed/", category: "technology" },
  { name: "Harvard Business Review", url: "https://hbr.org/feed", category: "business" },
  { name: "Wired", url: "https://www.wired.com/feed/rss", category: "technology" },
  { name: "Fast Company", url: "https://www.fastcompany.com/latest/rss", category: "business" },
];

interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  category: string;
}

interface RedditPost {
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

// Calculate timeframe cutoff date
function getTimeframeCutoff(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "7d":
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

// Check if cache is fresh (within 1 hour for 24h, 6 hours for 7d, 24 hours for 30d)
function getCacheFreshness(timeframe: string): number {
  switch (timeframe) {
    case "24h":
      return 60 * 60 * 1000; // 1 hour
    case "30d":
      return 24 * 60 * 60 * 1000; // 24 hours
    case "7d":
    default:
      return 6 * 60 * 60 * 1000; // 6 hours
  }
}

async function parseRSSFeed(feedUrl: string, source: string, category: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TrendingBot/1.0)",
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${source}: ${response.status}`);
      return [];
    }
    
    const text = await response.text();
    const items: RSSItem[] = [];
    
    // Simple XML parsing for RSS items
    const itemMatches = text.match(/<item>[\s\S]*?<\/item>/g) || [];
    
    for (const itemXml of itemMatches.slice(0, 15)) {
      const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || "";
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const description = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1] || "";
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      
      if (title && link) {
        items.push({
          title: title.replace(/<[^>]*>/g, "").trim(),
          link: link.trim(),
          description: description.replace(/<[^>]*>/g, "").substring(0, 200).trim(),
          pubDate,
          source,
          category,
        });
      }
    }
    
    return items;
  } catch (error) {
    console.error(`Error parsing ${source}:`, error);
    return [];
  }
}

async function fetchRedditPosts(topics: string[], timeframe: string): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];
  const cutoff = getTimeframeCutoff(timeframe);
  
  // Relevant subreddits for LinkedIn content
  const subreddits = ["Entrepreneur", "startups", "technology", "business", "productivity", ...topics];
  
  // Reddit time filter mapping
  const redditTimeFilter = timeframe === "24h" ? "day" : timeframe === "30d" ? "month" : "week";
  
  for (const subreddit of subreddits.slice(0, 5)) {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/top.json?t=${redditTimeFilter}&limit=15`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; TrendingBot/1.0)",
          },
        }
      );
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const children = data?.data?.children || [];
      
      for (const child of children) {
        const post = child.data;
        if (post.stickied || post.over_18) continue;
        
        // Filter by timeframe
        const postDate = new Date(post.created_utc * 1000);
        if (postDate < cutoff) continue;
        
        posts.push({
          title: post.title,
          url: post.url,
          subreddit: post.subreddit,
          score: post.score,
          numComments: post.num_comments,
          author: post.author,
          createdUtc: post.created_utc,
          selftext: post.selftext?.substring(0, 300) || "",
          permalink: `https://reddit.com${post.permalink}`,
        });
      }
    } catch (error) {
      console.error(`Error fetching r/${subreddit}:`, error);
    }
  }
  
  // Sort by score and return top posts
  return posts.sort((a, b) => b.score - a.score).slice(0, 25);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topics = [], page = 1, type = "all", timeframe = "7d" } = await req.json();
    
    console.log("Fetching trending content for topics:", topics, "timeframe:", timeframe);
    
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const cutoff = getTimeframeCutoff(timeframe);
    const cacheFreshness = getCacheFreshness(timeframe);
    
    const results: { news: RSSItem[]; posts: RedditPost[] } = {
      news: [],
      posts: [],
    };
    
    // Check cache for each topic
    let useCache = false;
    const cachedNews: RSSItem[] = [];
    const cachedPosts: RedditPost[] = [];
    
    if (topics.length > 0) {
      for (const topic of topics) {
        const topicLower = topic.toLowerCase();
        const cacheAge = new Date(Date.now() - cacheFreshness).toISOString();
        
        // Check if we have fresh cache
        const { data: cachedItems, error } = await supabaseAdmin
          .from("trending_cache")
          .select("*")
          .eq("topic", topicLower)
          .eq("timeframe", timeframe)
          .gt("fetched_at", cacheAge)
          .order("score", { ascending: false });
        
        if (!error && cachedItems && cachedItems.length > 0) {
          console.log(`Using cache for topic "${topic}": ${cachedItems.length} items`);
          useCache = true;
          
          for (const item of cachedItems) {
            if (item.item_type === "news") {
              cachedNews.push({
                title: item.title,
                link: item.source_url,
                description: item.description || "",
                pubDate: item.published_at || item.fetched_at,
                source: item.source_name || "",
                category: item.category || "",
              });
            } else if (item.item_type === "post") {
              cachedPosts.push({
                title: item.title,
                url: item.source_url,
                subreddit: item.source_name?.replace("r/", "") || "",
                score: item.score || 0,
                numComments: item.num_comments || 0,
                author: item.author || "",
                createdUtc: item.published_at ? new Date(item.published_at).getTime() / 1000 : 0,
                selftext: item.description || "",
                permalink: item.source_url,
              });
            }
          }
        }
      }
    }
    
    // If we have sufficient cached data, use it
    if (useCache && (cachedNews.length >= 5 || cachedPosts.length >= 5)) {
      results.news = cachedNews;
      results.posts = cachedPosts;
    } else {
      // Fetch fresh data
      
      // Fetch RSS feeds
      if (type === "all" || type === "news") {
        const feedPromises = RSS_FEEDS.map(feed => 
          parseRSSFeed(feed.url, feed.name, feed.category)
        );
        
        const feedResults = await Promise.all(feedPromises);
        results.news = feedResults.flat();
        
        // Filter by topics if provided
        if (topics.length > 0) {
          results.news = results.news.filter(item => 
            topics.some((topic: string) => 
              item.title.toLowerCase().includes(topic.toLowerCase()) ||
              item.description.toLowerCase().includes(topic.toLowerCase())
            )
          );
        }
        
        // Filter by timeframe
        results.news = results.news.filter(item => {
          const itemDate = new Date(item.pubDate);
          return itemDate >= cutoff;
        });
        
        // Sort by date
        results.news.sort((a, b) => 
          new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
        );
      }
      
      // Fetch Reddit posts
      if (type === "all" || type === "posts") {
        results.posts = await fetchRedditPosts(topics, timeframe);
      }
      
      // Cache the results for each topic (deduplicate by source_id)
      if (topics.length > 0 && (results.news.length > 0 || results.posts.length > 0)) {
        const cacheItems: any[] = [];
        
        for (const topic of topics) {
          const topicLower = topic.toLowerCase();
          
          // Cache news items
          for (const news of results.news.slice(0, 15)) {
            cacheItems.push({
              topic: topicLower,
              timeframe,
              item_type: "news",
              source_id: news.link,
              title: news.title,
              description: news.description,
              source_name: news.source,
              source_url: news.link,
              category: news.category,
              published_at: news.pubDate ? new Date(news.pubDate).toISOString() : null,
            });
          }
          
          // Cache post items
          for (const post of results.posts.slice(0, 15)) {
            cacheItems.push({
              topic: topicLower,
              timeframe,
              item_type: "post",
              source_id: post.permalink,
              title: post.title,
              description: post.selftext,
              source_name: `r/${post.subreddit}`,
              source_url: post.permalink,
              score: post.score,
              num_comments: post.numComments,
              author: post.author,
              published_at: new Date(post.createdUtc * 1000).toISOString(),
            });
          }
        }
        
        // Upsert to avoid duplicates (using ON CONFLICT)
        if (cacheItems.length > 0) {
          const { error: cacheError } = await supabaseAdmin
            .from("trending_cache")
            .upsert(cacheItems, { 
              onConflict: "source_id,topic,timeframe",
              ignoreDuplicates: true 
            });
          
          if (cacheError) {
            console.error("Error caching trending data:", cacheError);
          } else {
            console.log(`Cached ${cacheItems.length} trending items`);
          }
        }
      }
    }
    
    // Paginate
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    
    return new Response(
      JSON.stringify({
        news: results.news.slice(startIndex, startIndex + pageSize),
        posts: results.posts.slice(startIndex, startIndex + pageSize),
        hasMoreNews: results.news.length > startIndex + pageSize,
        hasMorePosts: results.posts.length > startIndex + pageSize,
        totalNews: results.news.length,
        totalPosts: results.posts.length,
        cached: useCache,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-trending:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
