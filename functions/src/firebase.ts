import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// Initialize only once
// Initialize only once
if (!admin.apps.length) {
    console.log("DEBUG: firebase.ts initializing admin app");

    // HARDCODED PATH to ensure we load the correct key in emulator
    // This is required because firebase.ts often loads before index.ts
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
            console.log("Initialized Firebase Admin with local service account (firebase.ts).");
        } catch (e) {
            console.warn("Failed to load local service account, falling back to default:", e);
            admin.initializeApp();
        }
    } else {
        admin.initializeApp();
    }
}

export const db = admin.firestore();
export { admin };

// Shared Configuration
export const STRIPE_SECRET_KEY = functions.config().stripe?.secret_key;
export const WEBHOOK_SECRET = functions.config().stripe?.webhook_secret;
export const STRIPE_PRICE_ID = functions.config().stripe?.price_id;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || functions.config().google?.api_key || "dummy_key";
