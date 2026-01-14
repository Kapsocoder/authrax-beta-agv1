
const admin = require("firebase-admin");

process.env.FIRESTORE_EMULATOR_HOST = "localhost:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";

const projectId = "authrax-beta-lv1";

admin.initializeApp({
    projectId,
});

const db = admin.firestore();

async function seed() {
    const userId = "4TytREh0UXXL2Ual1P8d4nu7q8S2"; // Kapil
    const postId = "test_scheduled_post_" + Date.now();

    // Schedule for 1 hour ago so it is definitely "due"
    const scheduledFor = new Date(Date.now() - 3600 * 1000).toISOString();

    console.log(`Seeding post ${postId} for user ${userId} scheduled at ${scheduledFor}`);

    await db.collection("posts").doc(postId).set({
        user_id: userId,
        content: "This is a test scheduled post seeded by the debugger.",
        status: "scheduled",
        scheduled_for: scheduledFor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        media_urls: [],
        // Add dummy linkedin connection data check if needed? 
        // No, the scheduler function checks the user's integration doc which exists.
    });

    console.log("Post seeded successfully.");
}

seed().catch(console.error);
