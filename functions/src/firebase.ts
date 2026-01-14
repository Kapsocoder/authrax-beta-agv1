import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// Initialize only once
// Initialize only once
import * as path from 'path';
import * as dotenv from 'dotenv';

// Config dotenv to look at root .env if running locally/emulator
// Config dotenv to look at root .env and .env.local if running locally/emulator
if (process.env.FUNCTIONS_EMULATOR) {
    // FORCE FIRESTORE EMULATOR if undefined (fixes testing in shell)
    if (!process.env.FIRESTORE_EMULATOR_HOST) {
        process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
        console.log("DEBUG: Forced FIRESTORE_EMULATOR_HOST to 127.0.0.1:8080");
    }

    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    dotenv.config({ path: path.resolve(__dirname, '../.env.local'), override: true });
}

if (!admin.apps.length) {
    console.log("DEBUG: firebase.ts initializing admin app");

    // HARDCODED PATH to ensure we load the correct key in emulator
    // This is required because firebase.ts often loads before index.ts
    const localKeyPath = "c:\\Users\\kapil\\OneDrive\\Business\\Development\\Authrax-Beta-Lv1\\authrax\\serviceAccountKey.json";

    // FIX: If we are running with the Auth Emulator, we MUST NOT initialize with production credentials.
    // Doing so forces the Admin SDK to verify tokens against production, which fails for emulator tokens.
    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
        console.log("DEBUG: Auth Emulator detected. Initializing Admin SDK *without* service account to allow emulator tokens.");
        admin.initializeApp({
            projectId: "authrax-beta-lv1",
            storageBucket: "authrax-beta-lv1.firebasestorage.app"
        });
    } else if (process.env.FUNCTIONS_EMULATOR && localKeyPath) {
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

// Attempt to find the key in the service account file if loaded
let localServiceAccountKey = "";
if (process.env.FUNCTIONS_EMULATOR) {
    try {
        // Re-require to get access to the fresh object in this scope if needed, 
        // though simplistic approach is to just read it again since it's cached by require
        const localKeyPath = "c:\\Users\\kapil\\OneDrive\\Business\\Development\\Authrax-Beta-Lv1\\authrax\\serviceAccountKey.json";
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const sa = require(localKeyPath);
        localServiceAccountKey = sa.GEMINI_API_KEY || sa.exclude?.GEMINI_API_KEY || sa.api_key;
        console.log("DEBUG: Loaded GEMINI_API_KEY from serviceAccountKey.json:", localServiceAccountKey ? "YES" : "NO");
    } catch (e) {
        console.warn("DEBUG: Failed to read serviceAccountKey.json for API key:", e);
    }
}

// Prioritize localServiceAccountKey over config to ensure local overrides work
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || localServiceAccountKey || functions.config().google?.api_key || "dummy_key";

console.log("DEBUG: Final GEMINI_API_KEY set to:", GEMINI_API_KEY === "dummy_key" ? "dummy_key" : "Configured Key (masked)");
