
const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const localApp = admin.initializeApp({
    projectId: 'authrax-beta-lv1'
}, 'localApp');

const db = localApp.firestore();

async function patch() {
    const UID = '4TytREh0UXXL2Ual1P8d4nu7q8S2';
    const PROFILE_ID = '8WX1QoaqpISZ4aKxjhj2';

    console.log(`\n🔧 Patching Data for User ${UID}...`);

    // 1. Patch Voice Profile (Fix Schema Mismatch)
    const profileRef = db.collection('users').doc(UID).collection('voice_profiles').doc(PROFILE_ID);
    const profileSnap = await profileRef.get();

    if (profileSnap.exists) {
        const data = profileSnap.data();
        const updates = {
            isActive: true, // Force Active
            is_trained: true, // Force Trained
            updated_at: new Date().toISOString()
        };

        // Fix sorting issue: Code queries 'created_at', Data has 'createdAt'
        if (!data.created_at && data.createdAt) {
            console.log("   Detected missing 'created_at'. Backfilling from 'createdAt'...");
            updates.created_at = data.createdAt;
        }

        await profileRef.set(updates, { merge: true });
        console.log(`   ✅ Voice Profile ${PROFILE_ID} patched (Active, Trained, Schema Fixed).`);
    } else {
        console.error(`   ❌ Voice Profile ${PROFILE_ID} not found!`);
    }

    // 2. Patch Saved Posts (Fix Empty "Saved Posts" list)
    const bestPostsRef = db.collection('users').doc(UID).collection('voice_profiles').doc('BestPostsFromUser');
    const bpSnap = await bestPostsRef.get();

    if (bpSnap.exists) {
        const data = bpSnap.data();
        if ((!data.sample_posts || data.sample_posts.length === 0) && data.last_analyzed_posts?.length > 0) {
            console.log("   Restoring 'sample_posts' from 'last_analyzed_posts'...");
            await bestPostsRef.set({
                sample_posts: data.last_analyzed_posts
            }, { merge: true });
            console.log(`   ✅ Restored ${data.last_analyzed_posts.length} saved posts.`);
        } else {
            console.log("   Saved Posts look okay (or no backup available).");
        }
    } else {
        console.log("   BestPostsFromUser doc not found.");
    }
}

patch();
