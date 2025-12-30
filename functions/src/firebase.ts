import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// Initialize only once
if (!admin.apps.length) {
    admin.initializeApp();
}

export const db = admin.firestore();
export { admin };

// Shared Configuration
export const STRIPE_SECRET_KEY = functions.config().stripe?.secret_key;
export const WEBHOOK_SECRET = functions.config().stripe?.webhook_secret;
export const STRIPE_PRICE_ID = functions.config().stripe?.price_id;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || functions.config().google?.api_key || "dummy_key";
