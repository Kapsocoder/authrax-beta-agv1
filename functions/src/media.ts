import * as functions from "firebase-functions";
import axios from 'axios';
import { admin } from './firebase';

// Helper to call Vertex AI Gemini Model (Text)
// Uses gemini-2.5-flash-image (Nano Banana) as primary for creative prompts, falls back to gemini-1.0-pro
async function callVertexGemini(prompt: string, systemInstruction?: string, modelId: string = "gemini-2.5-flash-image"): Promise<string> {
    const projectId = admin.app().options.projectId || process.env.GCLOUD_PROJECT || "authrax-beta";
    const location = "us-central1";

    if (!projectId) throw new Error("Could not determine Project ID");

    // Get Auth Token
    const token = await admin.credential.applicationDefault().getAccessToken();

    const requestBody: any = {
        contents: [{
            role: "user",
            parts: [{ text: prompt }]
        }]
    };

    if (systemInstruction) {
        requestBody.systemInstruction = {
            role: "system",
            parts: [{ text: systemInstruction }]
        };
    }

    const mkRequest = async (mId: string) => {
        console.log(`DEBUG: Calling Vertex AI (Text). Project: ${projectId}, Location: ${location}, Model: ${mId}`);
        return axios.post(
            `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${mId}:generateContent`,
            requestBody,
            {
                headers: {
                    "Authorization": `Bearer ${token.access_token}`,
                    "Content-Type": "application/json"
                }
            }
        );
    };

    try {
        let response;
        try {
            response = await mkRequest(modelId);
        } catch (err: any) {
            // If primary model fails with 404, try fallback
            if (err.response?.status === 404 && modelId !== "gemini-1.0-pro") {
                console.warn(`Version ${modelId} not found, falling back to gemini-1.0-pro`);
                response = await mkRequest("gemini-1.0-pro");
            } else {
                throw err;
            }
        }

        if (response.status !== 200) {
            throw new Error(`Vertex AI API failed: ${response.statusText}`);
        }

        const candidates = response.data.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error("No candidates returned from Gemini.");
        }

        // Extract text from parts
        const parts = candidates[0].content.parts;
        return parts.map((p: any) => p.text).join('').trim();

    } catch (error: any) {
        console.error("Vertex AI Call Failed:", error);
        if (axios.isAxiosError(error)) {
            console.error("Vertex AI Error Response Data:", JSON.stringify(error.response?.data));
            console.error("Vertex AI Error Status:", error.response?.status);

            // Distinguish specific model unavailability
            if (error.response?.status === 404) {
                throw new Error("Text Generation Model not available");
            }
        }
        throw error;
    }
}


export const suggestImagePrompt = functions.runWith({
    timeoutSeconds: 60,
    memory: "1GB"
}).https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");

    const { postContent } = data;
    if (!postContent) throw new functions.https.HttpsError("invalid-argument", "Post content is required.");

    try {
        const prompt = `
        You are an expert AI art director. 
        Analyze the following LinkedIn post content and write a detailed, creative image generation prompt for an AI model (like Imagen 3 or Midjourney).
        The image should be professional, engaging, and suitable for LinkedIn. Uses specific visual descriptors (lighting, style, composition).
        
        Post Content:
        "${postContent}"

        Output ONLY the prompt text, no explanations.
        `;

        // Use Vertex AI helper with updated model ID
        const generatedPrompt = await callVertexGemini(prompt);
        return { prompt: generatedPrompt };

    } catch (error: any) {
        console.error("Error suggesting prompt:", error);
        throw new functions.https.HttpsError("internal", "Failed to suggest prompt.");
    }
});

export const generateImage = functions.runWith({
    timeoutSeconds: 120, // Increased timeout as we might do 2 API calls
    memory: "2GB"
}).https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");

    const { prompt, aspectRatio = "1:1", style, postContent } = data;

    // We need EITHER a direct prompt OR (style + postContent)
    if (!prompt && (!style || !postContent)) {
        throw new functions.https.HttpsError("invalid-argument", "Either a 'prompt' OR both 'style' and 'postContent' are required.");
    }

    try {
        let finalPrompt = prompt;

        // If we are given a style and content, we generate the prompt dynamically using Gemini
        if (!finalPrompt && style && postContent) {
            console.log(`Generating prompt for style: ${style} with content length: ${postContent.length}`);

            const systemInstruction = `
            You are an expert AI art director for high-end social media content.
            Your task is to write a precise, creative image generation prompt for Imagen 3 based on the user's post content and a requested visual style.
            
            Visual Style Requested: ${style} - Use the following guidelines for this style:
            - "professional": High-end magazine editorial, shallow depth of field, subtle executive environment, 35mm lens, 8k resolution.
            - "concept": Minimalist 3D render, symbolic objects, elegant glass/marble textures, studio lighting, metaphorical.
            - "graphic": Modern flat design, vector illustration, geometric shapes, minimalist corporate aesthetic, clean lines.
            - "tech": Sleek cinematic close-up, glowing ambient light, abstract data patterns, glass and metal textures, futuristic.
            - "authentic": Natural lighting, film-like quality, emotional atmosphere, documentary style, storytelling depth.
            - "handrawn": Charcoal and ink sketch, textured paper, rough artistic lines, whiteboard doodle aesthetic.
            
            Input Content: "${postContent.substring(0, 1000)}"

            Instructions:
            1. Analyze the input content to identify the core subject, emotion, or metaphor.
            2. Create a visual scene that represents this core idea using the guidelines of the requested Visual Style.
            3. CRITICAL: The image must be RELEVANT to the content. Do not just make a generic image of the style. Fuse the style with the content's topic.
            4. Output ONLY the raw prompt text. No "Here is the prompt" or quotes.
            5. Do NOT include text in the image. Add "no text" to the prompt.
            `;

            // Use Vertex AI helper for prompt generation
            finalPrompt = await callVertexGemini("Generate the image prompt.", systemInstruction);
            console.log(`Gemini generated prompt: ${finalPrompt}`);
        }

        const projectId = admin.app().options.projectId || process.env.GCLOUD_PROJECT || "authrax-beta";
        const location = "us-central1";

        if (!projectId) throw new Error("Could not determine Project ID");

        // Get Auth Token
        const token = await admin.credential.applicationDefault().getAccessToken();

        // Switch to Imagen 2 (imagegeneration@006) which is Generally Available.
        // Imagen 3 often requires specific allowlisting or is region-restricted on some accounts.
        const modelId = "imagegeneration@006";

        console.log(`DEBUG: Calling Vertex AI (Imagen). Project: ${projectId}, Location: ${location}, Model: ${modelId}`);

        // Imagen uses the 'predict' endpoint, NOT 'generateContent'
        const response = await axios.post(
            `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`,
            {
                instances: [
                    { prompt: finalPrompt }
                ],
                parameters: {
                    sampleCount: 1,
                    // Imagen 2 does not support aspectRatio in the same way, but it does support 'aspectRatio' string.
                    // Common values: "1:1", "4:3", "3:4", "16:9", "9:16".
                    // We'll pass it if available (defaulting to 1:1 if undefined).
                    aspectRatio: aspectRatio || "1:1"
                }
            },
            {
                headers: {
                    "Authorization": `Bearer ${token.access_token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.status !== 200) {
            throw new Error(`Vertex AI API failed: ${response.statusText}`);
        }

        // Parse Imagen Response
        /*
          {
            "predictions": [
              {
                "bytesBase64Encoded": "..." 
              }
            ]
          }
        */
        const predictions = response.data.predictions;
        if (!predictions || predictions.length === 0) {
            throw new Error("No predictions returned from Imagen.");
        }

        const base64Image = predictions[0].bytesBase64Encoded || predictions[0]; // fallback if just string

        if (!base64Image) {
            console.error("Imagen Response:", JSON.stringify(response.data));
            throw new Error("No image data found in response.");
        }

        // Save to bucket
        const bucket = admin.storage().bucket();
        const fileName = `generated_images/${context.auth.uid}/${Date.now()}.png`;
        const file = bucket.file(fileName);

        const buffer = Buffer.from(base64Image, 'base64');

        await file.save(buffer, {
            metadata: { contentType: 'image/png' }
        });

        // Get Signed URL
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Practically permanent
        });

        return {
            imageUrl: url,
            generatedPrompt: finalPrompt
        };

    } catch (error: any) {
        console.error("Image Generation Error:", error);
        if (axios.isAxiosError(error)) {
            console.error("Axios Response Data:", JSON.stringify(error.response?.data));
            console.error("Axios Status:", error.response?.status);

            if (error.response?.status === 404) {
                // Still might happen if Imagen 3 isn't enabled
                throw new functions.https.HttpsError("not-found", "The Image Generation model is not available in this project. Please ensure Vertex AI API is enabled.");
            }
        }
        throw new functions.https.HttpsError("internal", error.message || "Failed to generate image.");
    }
});
