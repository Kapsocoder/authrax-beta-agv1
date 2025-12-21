import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface TrendingItem {
  title: string;
  description?: string;
  source_url: string;
  source_name?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, topics, forceRefresh = false } = await req.json();

    if (!userId || !topics || topics.length === 0) {
      return new Response(
        JSON.stringify({ error: "userId and topics are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for inserts
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    // Create user client for reading user data
    const supabaseUser = createClient(SUPABASE_URL!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user's voice profile system prompt
    const { data: voiceProfile } = await supabaseUser
      .from("voice_profiles")
      .select("system_prompt, tone, writing_style")
      .eq("user_id", userId)
      .maybeSingle();

    const systemPrompt = voiceProfile?.system_prompt || "";
    const tone = voiceProfile?.tone || "professional";
    const writingStyle = voiceProfile?.writing_style || "conversational";

    // Check if we already have fresh recommendations (within last 24 hours)
    if (!forceRefresh) {
      const { data: existingRecs } = await supabaseUser
        .from("recommended_posts")
        .select("*")
        .eq("user_id", userId)
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString())
        .order("generated_at", { ascending: false })
        .limit(6);

      if (existingRecs && existingRecs.length >= 3) {
        console.log("Returning existing recommendations");
        return new Response(
          JSON.stringify({ recommendations: existingRecs, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch trending data from cache for each topic
    const trendingItems: TrendingItem[] = [];
    
    for (const topic of topics.slice(0, 5)) {
      // Get cached trending items
      const { data: cachedNews } = await supabaseAdmin
        .from("trending_cache")
        .select("*")
        .eq("topic", topic.toLowerCase())
        .eq("timeframe", "7d")
        .order("fetched_at", { ascending: false })
        .limit(5);

      if (cachedNews) {
        for (const item of cachedNews) {
          trendingItems.push({
            title: item.title,
            description: item.description || "",
            source_url: item.source_url,
            source_name: item.source_name || "",
          });
        }
      }
    }

    // If no cached data, fetch fresh trending
    if (trendingItems.length < 3) {
      console.log("Fetching fresh trending data for recommendations");
      const trendingResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch-trending`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ topics, type: "all" }),
      });

      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        
        // Add news items
        for (const news of (trendingData.news || []).slice(0, 5)) {
          trendingItems.push({
            title: news.title,
            description: news.description,
            source_url: news.link,
            source_name: news.source,
          });
        }
        
        // Add post items
        for (const post of (trendingData.posts || []).slice(0, 5)) {
          trendingItems.push({
            title: post.title,
            description: post.selftext,
            source_url: post.permalink,
            source_name: `r/${post.subreddit}`,
          });
        }
      }
    }

    // Generate 2 recommendations per topic using AI
    const recommendations: any[] = [];
    
    for (const topic of topics.slice(0, 3)) {
      const relevantItems = trendingItems.slice(0, 5);
      
      const trendingContext = relevantItems
        .map((item, i) => `${i + 1}. "${item.title}" - ${item.description || ""}`)
        .join("\n");

      const prompt = `You are a LinkedIn content strategist helping create engaging posts.

Topic: ${topic}

User's Writing Style Preferences:
${systemPrompt ? `Custom Instructions: ${systemPrompt}` : ""}
Tone: ${tone}
Writing Style: ${writingStyle}

Current Trending Content (use for inspiration):
${trendingContext || "No specific trending content available - create original content."}

Create 2 unique, engaging LinkedIn posts about ${topic}. Each post should:
1. Be authentic and match the user's voice/style
2. Include a compelling hook in the first line
3. Be between 150-300 words
4. Include relevant hashtags
5. End with a thought-provoking question or call to action

Return as JSON array with this structure:
[
  {
    "title": "Brief title summarizing the post",
    "content": "Full LinkedIn post content",
    "source_inspiration": "What inspired this post"
  }
]

Only return the JSON array, no other text.`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a professional LinkedIn content creator. Always respond with valid JSON only." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!aiResponse.ok) {
          console.error("AI API error:", await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        
        // Parse JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const posts = JSON.parse(jsonMatch[0]);
          
          for (const post of posts) {
            recommendations.push({
              user_id: userId,
              topic,
              title: post.title,
              content: post.content,
              source_type: "ai_generated",
              source_url: relevantItems[0]?.source_url || null,
              source_title: post.source_inspiration || null,
            });
          }
        }
      } catch (error) {
        console.error(`Error generating recommendations for topic ${topic}:`, error);
      }
    }

    // Insert recommendations into database
    if (recommendations.length > 0) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("recommended_posts")
        .insert(recommendations)
        .select();

      if (insertError) {
        console.error("Error inserting recommendations:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to save recommendations" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ recommendations: inserted, cached: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ recommendations: [], message: "No recommendations generated" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
