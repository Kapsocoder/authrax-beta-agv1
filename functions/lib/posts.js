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
exports.scheduledPostPublisher = exports.publishScheduledPosts = exports.generatePost = void 0;
const functions = __importStar(require("firebase-functions"));
const axios_1 = __importDefault(require("axios"));
const firebase_1 = require("./firebase");
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
        }
        catch (error) {
            console.error("Error fetching voice profile:", error);
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
        const webhookPayload = {
            post_info: {
                id: postId || null,
                user_id: userId,
                input_mode: type,
                input_context: inputContext || prompt,
                user_instructions: userInstructions || null,
                source_url: _sourceUrl || null,
                media_url: (mediaUrls && mediaUrls.length > 0) ? mediaUrls[0] : null
            },
            template_info: templateDetails || null,
            brand_dna: voiceProfileDetails || null,
            is_regeneration: !!(editorContent && changeRequest),
            current_post_content: editorContent || null,
            change_request_instructions: changeRequest || null
        };
        functions.logger.info("Sending request to n8n webhook", {
            url: process.env.N8N_GENERATE_WEBHOOK_URL || "https://n8n.authrax.com/webhook/6fcfe924-f435-4811-9131-b509cc211e77",
            payload: webhookPayload
        });
        const webhookUrl = process.env.N8N_GENERATE_WEBHOOK_URL || "https://n8n.authrax.com/webhook/6fcfe924-f435-4811-9131-b509cc211e77";
        try {
            const response = await axios_1.default.post(webhookUrl, webhookPayload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 180000
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
const linkedin_1 = require("./linkedin");
// Exported logic for direct testing
const publishScheduledPosts = async () => {
    const now = new Date();
    functions.logger.info(`Starting scheduledPostPublisher at ${now.toISOString()}`);
    // Query scheduled posts due now or in the past
    // NOTE: using 'scheduled_for' as per fix
    const snapshot = await firebase_1.db.collection('posts')
        .where('status', '==', 'scheduled')
        .where('scheduled_for', '<=', now.toISOString())
        .get();
    functions.logger.info(`Found ${snapshot.size} scheduled posts due (scan time: ${now.toISOString()})`);
    if (snapshot.empty)
        return null;
    const tasks = snapshot.docs.map(async (doc) => {
        const post = doc.data();
        const userId = post.user_id;
        // Double check it hasn't been published in a race condition (idempotency)
        if (post.status !== 'scheduled')
            return;
        try {
            console.log(`Publishing scheduled post ${doc.id} for user ${userId}`);
            // Only attempt publish if connected. publishToLinkedInInternal handles the check.
            const result = await (0, linkedin_1.publishToLinkedInInternal)(userId, {
                content: post.content,
                mediaUrls: post.media_urls || (post.media_url ? [post.media_url] : [])
            });
            await doc.ref.update({
                status: 'published',
                published_at: new Date().toISOString(),
                linkedin_id: result.postId,
                error: firebase_1.admin.firestore.FieldValue.delete()
            });
            functions.logger.info(`Successfully published ${doc.id}`);
        }
        catch (e) {
            console.error(`Failed to publish scheduled post ${doc.id}`, e);
            await doc.ref.update({
                status: 'failed',
                error_message: e.message || 'Unknown error'
            });
        }
    });
    await Promise.all(tasks);
    return null;
};
exports.publishScheduledPosts = publishScheduledPosts;
exports.scheduledPostPublisher = functions.runWith({
    timeoutSeconds: 540,
    memory: '1GB'
}).pubsub.schedule('every 10 minutes').onRun(async (context) => {
    return (0, exports.publishScheduledPosts)();
});
//# sourceMappingURL=posts.js.map