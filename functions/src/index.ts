import * as admin from "firebase-admin";

// Initialize Admin SDK first
if (!admin.apps.length) {
    // Robust local development initialization
    console.log("DEBUG: Checking Env Vars");
    // HARDCODED PATH to ensure we load the correct key
    const localKeyPath = "c:\\Users\\kapil\\OneDrive\\Business\\Development\\Authrax-Beta-Lv1\\authrax\\serviceAccountKey.json";

    if (process.env.FUNCTIONS_EMULATOR && localKeyPath) {
        try {
            console.log("Requiring key from:", localKeyPath);
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            let serviceAccount = require(localKeyPath as string);

            // Handle potential ESM default export wrapping
            if (serviceAccount.default) {
                console.log("Detecting default export in service account require");
                serviceAccount = serviceAccount.default;
            }

            console.log("Loaded Service Account Keys:", Object.keys(serviceAccount));

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: "authrax-beta-lv1.firebasestorage.app"
            });
            console.log("Initialized Firebase Admin with local service account.");
        } catch (e) {
            console.warn("Failed to load local service account, falling back to default:", e);
            admin.initializeApp();
        }
    } else {
        admin.initializeApp();
    }
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
