import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

// Use onRequest to manually handle CORS, bypassing potential onCall strictness issues
export const analyzeVoiceHandler = async (req: functions.https.Request, res: functions.Response) => {
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
    } catch (e) {
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
        if (userDoc.exists && userDoc.data()?.saved_posts) {
            posts = userDoc.data()?.saved_posts;
            console.log(`[AnalyzeVoice] Found ${posts.length} posts in Firestore.`);
        } else {
            res.status(400).json({ success: false, error: "No posts provided and none found in profile." });
            return;
        }
    }

    console.log(`[AnalyzeVoice] Starting for user ${userId} with ${posts.length} posts`);

    // 5. Send to n8n Webhook
    // TODO: Switch to Production URL when confirmed
    const webhookUrl = "https://authrax.app.n8n.cloud/webhook-test/16876421-9c87-4483-9110-dbeda000d828";

    try {
        const response = await axios.post(webhookUrl, {
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

    } catch (error: any) {
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
