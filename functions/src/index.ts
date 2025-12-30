import * as admin from "firebase-admin";

// Initialize Admin SDK first (relying on firebase.ts init if used, but safe to do here)
if (!admin.apps.length) {
    admin.initializeApp();
}

// Export modules
export * from './posts';
export * from './recommendations';
export * from './media';
export * from './extraction';
export * from './payment';

// Legacy exports (retained for compatibility if needed, but directed to new modules)
import * as linkedin from './linkedin';
import * as analyze from './analyze_voice';
import * as functions from 'firebase-functions';

export const getLinkedInAuthUrl = linkedin.getLinkedInAuthUrl;
export const handleLinkedInCallback = linkedin.handleLinkedInCallback;
export const publishToLinkedIn = linkedin.publishToLinkedIn;

// Export analyzeVoice as onRequest to handle manual CORS
export const analyzeVoice = functions.runWith({
    timeoutSeconds: 60,
    memory: "1GB"
}).https.onRequest(analyze.analyzeVoiceHandler);

export * from './n8n_handler';
