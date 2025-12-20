import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    
    for (const itemXml of itemMatches.slice(0, 10)) {
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

async function fetchRedditPosts(topics: string[]): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];
  
  // Relevant subreddits for LinkedIn content
  const subreddits = ["Entrepreneur", "startups", "technology", "business", "productivity", ...topics];
  
  for (const subreddit of subreddits.slice(0, 5)) {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`,
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
  return posts.sort((a, b) => b.score - a.score).slice(0, 20);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topics = [], page = 1, type = "all" } = await req.json();
    
    console.log("Fetching trending content for topics:", topics);
    
    const results: { news: RSSItem[]; posts: RedditPost[] } = {
      news: [],
      posts: [],
    };
    
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
      
      // Sort by date
      results.news.sort((a, b) => 
        new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
      );
    }
    
    // Fetch Reddit posts
    if (type === "all" || type === "posts") {
      results.posts = await fetchRedditPosts(topics);
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
