import * as functions from "firebase-functions";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import { admin, GEMINI_API_KEY } from './firebase';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

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

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const response = await result.response;
        return { prompt: response.text().trim() };
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

            const promptResult = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: "Generate the image prompt." }] }],
                systemInstruction: { role: "system", parts: [{ text: systemInstruction }] }
            });

            const promptResponse = await promptResult.response;
            finalPrompt = promptResponse.text().trim();
            console.log(`Gemini generated prompt: ${finalPrompt}`);
        }

        // Add aspect ratio to the prompt just in case, though usually sent as param
        finalPrompt = `${finalPrompt} --aspect-ratio ${aspectRatio}`;

        const projectId = admin.app().options.projectId || process.env.GCLOUD_PROJECT || "authrax-beta";
        const location = "us-central1";

        if (!projectId) throw new Error("Could not determine Project ID");

        // Get Auth Token
        const token = await admin.credential.applicationDefault().getAccessToken();

        // Call Vertex AI API for Gemini 2.5 Flash Image ("Nano Banana")
        // Note: Gemini use generateContent, unlike Imagen which uses predict.
        // We rely on the prompt parameters (e.g. --aspect-ratio) for configuration as this is a multimodal prompt.
        const response = await axios.post(`https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash-image:generateContent`, {
            contents: [{
                role: "user",
                parts: [{ text: finalPrompt }]
            }]
        }, {
            headers: {
                "Authorization": `Bearer ${token.access_token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.status !== 200) {
            throw new Error(`Vertex AI API failed: ${response.statusText}`);
        }

        // Parse Gemini Response
        const candidates = response.data.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error("No candidates returned from Gemini.");
        }

        const parts = candidates[0].content.parts;
        if (!parts || parts.length === 0) {
            throw new Error("No content parts returned.");
        }

        // Look for inlineData (image)
        const imagePart = parts.find((p: any) => p.inlineData && p.inlineData.data);

        if (!imagePart) {
            console.error("Gemini Response Parts:", JSON.stringify(parts));
            throw new Error("No image data found in response. The model might have returned text instead.");
        }

        const base64Image = imagePart.inlineData.data;

        // Save to bucket
        const bucket = admin.storage().bucket();
        const fileName = `generated_images/${context.auth.uid}/${Date.now()}.png`; // Saving as PNG even if JPEG source, or change extension
        const file = bucket.file(fileName);

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Image, 'base64');

        await file.save(buffer, {
            metadata: { contentType: 'image/png' }
        });

        // Get Signed URL
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Practically permanent for now
        });

        return {
            imageUrl: url,
            generatedPrompt: finalPrompt // Return the prompt so the UI can show/save it
        };

    } catch (error: any) {
        console.error("Image Generation Error:", error);
        if (axios.isAxiosError(error)) {
            console.error("Axios Response Data:", JSON.stringify(error.response?.data));
            console.error("Axios Status:", error.response?.status);

            // Helpful error for user if model doesn't exist (e.g. if they don't have access to 2.5 yet)
            if (error.response?.status === 404) {
                throw new functions.https.HttpsError("not-found", "The 'nano banana' (Gemini 2.5) model is not available in this project/location. Please contact support.");
            }
        }
        throw new functions.https.HttpsError("internal", error.message || "Failed to generate image.");
    }
});
