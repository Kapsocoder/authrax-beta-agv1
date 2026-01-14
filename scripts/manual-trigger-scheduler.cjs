
const admin = require("firebase-admin");

// FORCE EMULATOR ENV
process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
process.env.FUNCTIONS_EMULATOR = "true";

// Import compiled code
// Note: We need to point to where tsc outputs. Usually functions/lib/posts.js
const postsModule = require("../functions/lib/posts");

async function main() {
    console.log("Triggering publishScheduledPosts directly...");
    try {
        await postsModule.publishScheduledPosts();
        console.log("Finished publishScheduledPosts execution.");
    } catch (e) {
        console.error("Error executing scheduler:", e);
    }
}

main();
