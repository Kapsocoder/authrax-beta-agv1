import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { posts, userId } = await req.json();
    
    if (!posts || posts.length === 0) {
      throw new Error("No posts provided for analysis");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const analysisPrompt = `Analyze the following LinkedIn posts and extract the writer's unique voice characteristics. Be specific and actionable.

Posts to analyze:
${posts.join("\n\n---\n\n")}

Provide analysis in exactly this JSON format:
{
  "tone": "describe the overall tone (e.g., 'conversational and warm', 'professional but approachable', 'bold and provocative')",
  "writing_style": "describe the writing style (e.g., 'story-driven with personal anecdotes', 'data-backed and analytical', 'inspirational and motivational')",
  "emoji_usage": "none/minimal/moderate/frequent",
  "sentence_length": "short/medium/long/varied",
  "formatting_patterns": ["list specific patterns like 'uses bullet points', 'starts with a hook question', 'ends with CTA'],
  "analysis_summary": "A 2-3 sentence summary that could be used as instructions for an AI to mimic this writing style"
}`;

    console.log("Analyzing voice from", posts.length, "posts");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are an expert writing analyst. Analyze writing samples and extract voice characteristics. Always respond with valid JSON only, no markdown formatting." 
          },
          { role: "user", content: analysisPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to analyze voice");
    }

    const data = await response.json();
    let analysisText = data.choices?.[0]?.message?.content;

    if (!analysisText) {
      throw new Error("No analysis generated");
    }

    // Clean up the response - remove markdown code blocks if present
    analysisText = analysisText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      console.error("Failed to parse AI response:", analysisText);
      throw new Error("Invalid analysis format");
    }

    // Update the voice profile in the database
    const { error: updateError } = await supabase
      .from("voice_profiles")
      .update({
        tone: analysis.tone,
        writing_style: analysis.writing_style,
        emoji_usage: analysis.emoji_usage,
        sentence_length: analysis.sentence_length,
        formatting_patterns: analysis.formatting_patterns,
        analysis_summary: analysis.analysis_summary,
        sample_posts: posts,
        is_trained: true,
        trained_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Database update error:", updateError);
      throw new Error("Failed to save voice profile");
    }

    console.log("Successfully analyzed and saved voice profile");

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-voice:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
