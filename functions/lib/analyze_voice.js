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
exports.analyzeVoiceHandler = void 0;
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
// Use onRequest to manually handle CORS, bypassing potential onCall strictness issues
const analyzeVoiceHandler = async (req, res) => {
    var _a, _b;
    // 1. Manual CORS Headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // 2. Handle Preflight
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    // 3. Manual Auth Verification (since we lost onCall auto-auth)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: "Unauthorized: Missing token" });
        return;
    }
    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
    }
    catch (e) {
        console.error("Token verification failed", e);
        res.status(401).json({ success: false, error: "Unauthorized: Invalid token" });
        return;
    }
    const userId = decodedToken.uid;
    const data = req.body.data || req.body; // onCall sends { data: ... }, fetch sends body directly. Support both.
    // 4. Input Validation & Fallback
    let posts = data.posts;
    if (!posts || !Array.isArray(posts) || posts.length === 0) {
        // Fallback: Try to fetch "saved_posts" from Firestore if not provided
        console.log(`[AnalyzeVoice] No posts in body, checking Firestore for user ${userId}`);
        const userRef = admin.firestore().collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists && ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.saved_posts)) {
            posts = (_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.saved_posts;
            console.log(`[AnalyzeVoice] Found ${posts.length} posts in Firestore.`);
        }
        else {
            res.status(400).json({ success: false, error: "No posts provided and none found in profile." });
            return;
        }
    }
    console.log(`[AnalyzeVoice] Starting for user ${userId} with ${posts.length} posts`);
    // 5. Send to n8n Webhook
    // TODO: Switch to Production URL when confirmed
    const webhookUrl = "https://authrax.app.n8n.cloud/webhook/16876421-9c87-4483-9110-dbeda000d828";
    try {
        const response = await axios_1.default.post(webhookUrl, {
            user_id: userId,
            posts: posts,
            timestamp: new Date().toISOString()
        }, {
            timeout: 10000 // 10s timeout
        });
        console.log(`[AnalyzeVoice] Webhook sent. Status: ${response.status}`);
        // Return success to frontend
        res.status(200).json({
            success: true,
            message: "Analysis initiated successfully.",
            webhookStatus: response.status
        });
    }
    catch (error) {
        console.error(`[AnalyzeVoice] Webhook failed: ${error.message}`);
        // Log detailed error from axios if available
        if (error.response) {
            console.error(`[AnalyzeVoice] Response data:`, error.response.data);
            console.error(`[AnalyzeVoice] Response status:`, error.response.status);
        }
        res.status(500).json({
            success: false,
            error: "Failed to trigger analysis webhook: " + (error.message || "Unknown error")
        });
    }
};
exports.analyzeVoiceHandler = analyzeVoiceHandler;
//# sourceMappingURL=analyze_voice.js.map