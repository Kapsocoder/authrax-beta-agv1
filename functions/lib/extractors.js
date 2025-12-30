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
exports.extractYouTube = exports.extractWebPage = void 0;
const functions = __importStar(require("firebase-functions"));
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
// Initialize Gemini Client Lazily
// Note: We use the same config key as index.ts
function getGenAI() {
    var _a;
    const apiKey = ((_a = functions.config().google) === null || _a === void 0 ? void 0 : _a.api_key) || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY");
    }
    return new generative_ai_1.GoogleGenerativeAI(apiKey);
}
// const genAI = new GoogleGenerativeAI(apiKey); // Moved inside function
async function extractWebPage(url) {
    try {
        const { data } = await axios_1.default.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });
        const $ = cheerio.load(data);
        // Remove script, style, and other non-content elements
        $('script, style, nav, footer, iframe, svg, noscript, header, aside').remove();
        // Extract main text
        let text = $('body').text();
        // Collapse whitespace
        text = text.replace(/\s\s+/g, ' ').trim();
        // Limit length
        return text.substring(0, 20000);
    }
    catch (error) {
        console.error(`Error extracting web page ${url}:`, error.message);
        throw new Error(`Failed to extract content from URL: ${error.message}`);
    }
}
exports.extractWebPage = extractWebPage;
async function extractYouTube(url) {
    try {
        console.log(`Starting Gemini Video Analysis for: ${url}`);
        // Use Gemini 2.0 Flash for its multimodal capabilities
        // We use the 'gemini-2.0-flash-exp' or 'gemini-1.5-flash' depending on availability, 
        // but docs urge 2.0 or 1.5 Pro for best video performance.
        // Let's stick to 'gemini-2.0-flash-exp' based on user's earlier context or 'gemini-1.5-flash' as stable.
        // The user mentioned "Gemini 2.0 Flash" in their manual text, so we assume that model is desired/available.
        // Fallback to 1.5-flash if 2.0 is experimental/unavailable.
        // Actuallly, let's use a widely available one: "gemini-1.5-flash-001".
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" }); // Corrected to valid Experimental model  
        // Validated model name from docs usually 'gemini-1.5-flash' or 'gemini-1.5-pro'. 
        // User context mentioned "Gemini 2.0 Flash", likely 'gemini-2.0-flash-exp'.
        // Safest bet for production is 1.5-flash, but let's try 2.0-flash-exp if user requested.
        // Actuallly, let's use a widely available one: "gemini-1.5-flash-001".
        // Construct the part with the YouTube URL directly
        // Based on Python SDK mapping: file_data={'file_uri': url, 'mime_type': 'video/mp4'}
        // In JS SDK, this maps to the 'fileData' part.
        const parts = [
            {
                fileData: {
                    mimeType: "video/mp4",
                    fileUri: url
                }
            },
            {
                text: "Analyze this video completely. Provide a comprehensive summary of the key topics, insights, and speakers. This summary will be used to write a LinkedIn post, so capture the core value and any interesting quotes or facts."
            }
        ];
        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();
        if (!text) {
            throw new Error("Gemini returned empty response.");
        }
        console.log("Gemini Analysis Successful");
        return text;
    }
    catch (error) {
        console.error(`Gemini Video Extraction failed for ${url}:`, error.message);
        // Fallback or re-throw
        throw new Error(`Failed to analyze video with Gemini: ${error.message}`);
    }
}
exports.extractYouTube = extractYouTube;
//# sourceMappingURL=extractors.js.map