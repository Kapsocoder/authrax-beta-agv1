import * as functions from "firebase-functions";
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import * as cheerio from 'cheerio';


// Initialize Gemini Client Lazily
// Note: We use the same config key as index.ts
function getGenAI() {
    const apiKey = functions.config().google?.api_key || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY");
    }
    return new GoogleGenerativeAI(apiKey);
}
// const genAI = new GoogleGenerativeAI(apiKey); // Moved inside function

export async function extractWebPage(url: string): Promise<string> {
    try {
        const { data } = await axios.get(url, {
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
    } catch (error: any) {
        console.error(`Error extracting web page ${url}:`, error.message);
        throw new Error(`Failed to extract content from URL: ${error.message}`);
    }
}

export async function extractYouTube(url: string): Promise<string> {
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

    } catch (error: any) {
        console.error(`Gemini Video Extraction failed for ${url}:`, error.message);
        // Fallback or re-throw
        throw new Error(`Failed to analyze video with Gemini: ${error.message}`);
    }
}
