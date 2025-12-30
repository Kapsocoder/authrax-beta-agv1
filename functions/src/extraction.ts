import * as functions from "firebase-functions";
import { extractWebPage, extractYouTube } from './extractors';

// Expose extraction logic to frontend for preview
export const extractContent = functions.runWith({
    timeoutSeconds: 60,
    memory: "1GB" // Browser needs memory
}).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { url, type } = data;
    if (!url) {
        throw new functions.https.HttpsError('invalid-argument', 'URL is required.');
    }

    try {
        let content = "";
        if (type === 'video') {
            content = await extractYouTube(url);
        } else {
            content = await extractWebPage(url);
        }
        return { success: true, content };
    } catch (error: any) {
        console.error("Extraction error:", error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to extract content.');
    }
});
