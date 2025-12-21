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
    const { prompt, type, userId, tone } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user's voice profile for personalization
    let voiceContext = "";
    let systemPromptOverride = "";
    if (userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: voiceProfile } = await supabase
        .from("voice_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (voiceProfile?.is_trained) {
        // Use custom system prompt if available
        if (voiceProfile.system_prompt) {
          systemPromptOverride = voiceProfile.system_prompt;
        }
        
        if (voiceProfile.analysis_summary) {
          voiceContext = `
        
IMPORTANT - Match the user's writing style:
${voiceProfile.analysis_summary}

Tone: ${voiceProfile.tone || "professional"}
Writing style: ${voiceProfile.writing_style || "informative"}
Emoji usage: ${voiceProfile.emoji_usage || "moderate"}
Sentence length: ${voiceProfile.sentence_length || "medium"}
`;
        }
      }
    }

    // Tone overlays
    const toneInstructions: Record<string, string> = {
      professional: "Write in a polished, business-appropriate tone. Be authoritative but approachable.",
      witty: "Add clever observations and subtle humor. Be engaging and entertaining while staying professional.",
      inspiring: "Be motivational and uplifting. Share insights that inspire action and positive change.",
      casual: "Write in a friendly, conversational tone. Be relatable and approachable like talking to a friend.",
      educational: "Focus on teaching and sharing knowledge. Use clear explanations and practical examples.",
    };

    const toneOverlay = tone && toneInstructions[tone] ? `\n\nTone overlay: ${toneInstructions[tone]}` : "";

    const systemPrompt = systemPromptOverride || `You are an expert LinkedIn content creator. Generate engaging, authentic LinkedIn posts that drive engagement.

Guidelines:
- Write in first person
- Use line breaks for readability (LinkedIn style)
- Include a hook in the first line
- Add relevant emojis sparingly
- End with a call-to-action or thought-provoking question
- Keep posts between 150-300 words for optimal engagement
- DO NOT include hashtags at the end
- Make it feel personal and authentic, not corporate
${voiceContext}${toneOverlay}`;

    let userPrompt = "";
    switch (type) {
      case "topic":
      case "idea":
        userPrompt = `Write a LinkedIn post based on the following:\n\n${prompt}`;
        break;
      case "url":
        userPrompt = `Write a LinkedIn post sharing insights or commentary about this content. Summarize the key points and add your personal take:\n\n${prompt}`;
        break;
      case "notes":
      case "voice":
        userPrompt = `Transform these rough thoughts/notes into a polished, engaging LinkedIn post. Keep the core message but make it engaging:\n\n${prompt}`;
        break;
      case "repurpose":
        userPrompt = `Repurpose this document content into a compelling LinkedIn post. Extract the key insights and present them in an engaging way:\n\n${prompt}`;
        break;
      default:
        userPrompt = prompt;
    }

    console.log("Generating post with prompt:", userPrompt.substring(0, 100));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
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
      throw new Error("Failed to generate content");
    }

    const data = await response.json();
    const generatedContent = data.choices?.[0]?.message?.content;

    if (!generatedContent) {
      throw new Error("No content generated");
    }

    console.log("Successfully generated post");

    return new Response(
      JSON.stringify({ content: generatedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-post:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
