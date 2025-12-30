"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateImage = exports.suggestImagePrompt = void 0;
const functions = __importStar(require("firebase-functions"));
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = __importDefault(require("axios"));
const firebase_1 = require("./firebase");
const genAI = new generative_ai_1.GoogleGenerativeAI(firebase_1.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
exports.suggestImagePrompt = functions.runWith({
    timeoutSeconds: 60,
    memory: "1GB"
}).https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { postContent } = data;
    if (!postContent)
        throw new functions.https.HttpsError("invalid-argument", "Post content is required.");
    try {
        const prompt = `
        You are an expert AI art director. 
        Analyze the following LinkedIn post content and write a detailed, creative image generation prompt for an AI model (like Imagen 3 or Midjourney).
        The image should be professional, engaging, and suitable for LinkedIn. Uses specific visual descriptors (lighting, style, composition).
        
        Post Content:
        "${postContent.substring(0, 1000)}..."

        Output ONLY the prompt text, no explanations.
        `;
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        const response = await result.response;
        return { prompt: response.text().trim() };
    }
    catch (error) {
        console.error("Error suggesting prompt:", error);
        throw new functions.https.HttpsError("internal", "Failed to suggest prompt.");
    }
});
exports.generateImage = functions.runWith({
    timeoutSeconds: 120,
    memory: "2GB"
}).https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { prompt, aspectRatio = "1:1" } = data;
    if (!prompt)
        throw new functions.https.HttpsError("invalid-argument", "Prompt is required.");
    try {
        const projectId = firebase_1.admin.app().options.projectId; // Or functions.config().project.id
        const location = "us-central1";
        // Get Auth Token
        const token = await firebase_1.admin.credential.applicationDefault().getAccessToken();
        // Call Vertex AI API for Imagen 3
        const response = await axios_1.default.post(`https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`, {
            instances: [{ prompt: prompt }],
            parameters: {
                aspectRatio: aspectRatio,
                sampleCount: 1,
            }
        }, {
            headers: {
                "Authorization": `Bearer ${token.access_token}`,
                "Content-Type": "application/json"
            }
        });
        if (response.status !== 200) {
            throw new Error(`Vertex AI API failed: ${response.statusText}`);
        }
        const predictions = response.data.predictions;
        if (!predictions || predictions.length === 0) {
            throw new Error("No image generated.");
        }
        const base64Image = predictions[0].bytesBase64Encoded;
        // Save to bucket
        const bucket = firebase_1.admin.storage().bucket();
        const fileName = `generated_images/${context.auth.uid}/${Date.now()}.png`;
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
        return { imageUrl: url };
    }
    catch (error) {
        console.error("Image Generation Error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Failed to generate image.");
    }
});
//# sourceMappingURL=media.js.map