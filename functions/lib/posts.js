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
exports.generatePost = void 0;
const functions = __importStar(require("firebase-functions"));
// import { GoogleGenerativeAI } from "@google/generative-ai"; // Unused now
const axios_1 = __importDefault(require("axios"));
const firebase_1 = require("./firebase"); // Removed unused GEMINI_API_KEY
// import { extractWebPage, extractYouTube } from './extractors'; // Unused now
// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); // Unused now
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" }); // Unused now
exports.generatePost = functions.runWith({
    timeoutSeconds: 300,
    memory: "1GB"
}).https.onCall(async (data, context) => {
    var _a, _b;
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }
    const userId = context.auth.uid;
    try {
        const { prompt, type, sourceUrl: _sourceUrl, editorContent, changeRequest, templateId, 
        // New Strict Fields
        postId, inputContext, userInstructions, mediaUrls } = data;
        // 0. CHECK LIMITS (Keep existing limit logic)
        const userDoc = await firebase_1.db.doc(`users/${userId}`).get();
        const userData = userDoc.data();
        const isPro = (userData === null || userData === void 0 ? void 0 : userData.subscription_tier) === 'pro';
        const adminOverrides = (userData === null || userData === void 0 ? void 0 : userData.admin_overrides) || {};
        const bypassLimits = adminOverrides.bypass_limits === true;
        const weeklyUsage = (userData === null || userData === void 0 ? void 0 : userData.weekly_usage) || { count: 0, start_date: new Date().toISOString() };
        const now = new Date();
        const startDate = new Date(weeklyUsage.start_date);
        const dayDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        let currentCount = weeklyUsage.count || 0;
        if (dayDiff >= 7)
            currentCount = 0;
        if (!isPro && !bypassLimits) {
            if (currentCount >= 1) {
                throw new functions.https.HttpsError('resource-exhausted', "LIMIT_REACHED: Free users are limited to 1 post per week. Upgrade to Pro for unlimited generation.");
            }
        }
        // 1. Fetch Active Voice Profile
        let voiceProfileDetails = null;
        try {
            const voiceProfilesRef = firebase_1.db.collection(`users/${userId}/voice_profiles`);
            const activeProfileQuery = await voiceProfilesRef.where('isActive', '==', true).limit(1).get();
            if (!activeProfileQuery.empty) {
                const profileData = activeProfileQuery.docs[0].data();
                voiceProfileDetails = {
                    belief_layer: profileData.belief_layer || null,
                    expression_layer: profileData.expression_layer || null,
                    governance_layer: profileData.governance_layer || null,
                    judgement_layer: profileData.judgement_layer || null,
                    system_prompt: profileData.system_prompt || null
                };
            }
            else {
                // Fallback to 'default' if no active profile found (optional, but good for robustness)
                const defaultProfileDoc = await voiceProfilesRef.doc('default').get();
                if (defaultProfileDoc.exists) {
                    const profileData = defaultProfileDoc.data();
                    voiceProfileDetails = {
                        belief_layer: (profileData === null || profileData === void 0 ? void 0 : profileData.belief_layer) || null,
                        expression_layer: (profileData === null || profileData === void 0 ? void 0 : profileData.expression_layer) || null,
                        governance_layer: (profileData === null || profileData === void 0 ? void 0 : profileData.governance_layer) || null,
                        judgement_layer: (profileData === null || profileData === void 0 ? void 0 : profileData.judgement_layer) || null,
                        system_prompt: (profileData === null || profileData === void 0 ? void 0 : profileData.system_prompt) || null
                    };
                }
            }
        }
        catch (error) {
            console.error("Error fetching voice profile:", error);
            // Continue without voice profile
        }
        // 2. Fetch Template Details
        let templateDetails = null;
        if (templateId) {
            try {
                const templateDoc = await firebase_1.db.collection('templates').doc(templateId).get();
                if (templateDoc.exists) {
                    const tData = templateDoc.data();
                    templateDetails = {
                        name: tData === null || tData === void 0 ? void 0 : tData.name,
                        user_type: tData === null || tData === void 0 ? void 0 : tData.user_type,
                        objectives: tData === null || tData === void 0 ? void 0 : tData.objectives,
                        structure: tData === null || tData === void 0 ? void 0 : tData.structure,
                        themes: tData === null || tData === void 0 ? void 0 : tData.themes,
                        prompt: tData === null || tData === void 0 ? void 0 : tData.prompt
                    };
                    // Increment usage count (keeping existing logic)
                    await templateDoc.ref.update({
                        usage_count: firebase_1.admin.firestore.FieldValue.increment(1)
                    });
                }
            }
            catch (error) {
                console.error("Error fetching template:", error);
            }
        }
        // 3. Construct Payload
        // Determine capturedContent and URL based on type
        // Use originalContent if passed (previewed), else prompt (for voice/draft/pdf)
        // For URL/Video, if we didn't preview, we might just send the URL and let n8n handle extraction? 
        // Or should we extract here? The user said "Process: ... Backend attempts to scrape".
        // BUT the user REQUEST says "send... capturedContent, URL".
        // If we haven't extracted yet (no preview), capturedContent might be empty or just user notes.
        // Let's stick to the simple flow: capturedContent = prompt (extracted or user text), URL = sourceUrl.
        // 3. Construct Payload per User Requirements
        const webhookPayload = {
            // Post Information
            post_info: {
                id: postId || null,
                user_id: userId,
                input_mode: type,
                input_context: inputContext || prompt,
                user_instructions: userInstructions || null,
                source_url: _sourceUrl || null,
                media_url: (mediaUrls && mediaUrls.length > 0) ? mediaUrls[0] : null
            },
            // Template Information
            template_info: templateDetails || null,
            // Brand DNA Information
            brand_dna: voiceProfileDetails || null,
            // Legacy mappings (for safety during transition)
            is_regeneration: !!(editorContent && changeRequest),
            current_post_content: editorContent || null,
            change_request_instructions: changeRequest || null
        };
        functions.logger.info("Sending request to n8n webhook", {
            url: "https://authrax.app.n8n.cloud/webhook/6fcfe924-f435-4811-9131-b509cc211e77",
            payload: webhookPayload
        });
        // 4. Call n8n Webhook
        const webhookUrl = "https://authrax.app.n8n.cloud/webhook/6fcfe924-f435-4811-9131-b509cc211e77";
        try {
            const response = await axios_1.default.post(webhookUrl, webhookPayload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 60000 // 60s timeout for n8n processing
            });
            functions.logger.info("n8n webhook success", { status: response.status, data: response.data });
            if (!response.data || (!response.data.content && !response.data.output_content && typeof response.data !== 'string')) {
                throw new Error("Invalid response from generation webhook");
            }
            const generatedContent = response.data.content || response.data.output_content || (typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
            return { content: generatedContent };
        }
        catch (axiosError) {
            functions.logger.error("n8n webhook failed", {
                message: axiosError.message,
                response: (_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.data,
                status: (_b = axiosError.response) === null || _b === void 0 ? void 0 : _b.status
            });
            throw axiosError;
        }
    }
    catch (error) {
        functions.logger.error("Error generating post:", error);
        throw new functions.https.HttpsError('internal', error.message || "Failed to generate post");
    }
});
//# sourceMappingURL=posts.js.map