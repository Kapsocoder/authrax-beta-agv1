
const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const localApp = admin.initializeApp({
    projectId: 'authrax-beta-lv1'
}, 'localApp');

const db = localApp.firestore();

async function inspect() {
    console.log("🔍 Inspecting Local Emulator Data...");

    // 1. Check Users Collection
    const usersSnap = await db.collection('users').get();
    console.log(`\n👥 Users found (${usersSnap.size}):`);
    usersSnap.docs.forEach(doc => {
        console.log(`   - ID: ${doc.id} | Data: ${JSON.stringify(doc.data()).substring(0, 100)}...`);
    });

    // 2. Check Posts Collection (and their user_ids)
    const postsSnap = await db.collection('posts').get();
    console.log(`\n📝 Posts found (${postsSnap.size}):`);

    // Group by user_id
    const postsByUser = {};
    postsSnap.docs.forEach(doc => {
        const d = doc.data();
        const uid = d.user_id || 'UNKNOWN';
        postsByUser[uid] = (postsByUser[uid] || 0) + 1;
    });

    Object.entries(postsByUser).forEach(([uid, count]) => {
        console.log(`   - User ${uid}: ${count} posts`);
    });

    // 3. Specific check for our target user
    const TARGET_UID = 'ZI49Z4nfbelQGsQn22eTcEVsK9Jt';
    console.log(`\n🎯 Checking target UID: ${TARGET_UID}`);

    const targetUserParams = await db.collection('users').doc(TARGET_UID).get();
    console.log(`   - User Doc exists? ${targetUserParams.exists}`);

    const targetPosts = await db.collection('posts').where('user_id', '==', TARGET_UID).get();
    console.log(`   - Posts count: ${targetPosts.size}`);

    const targetProfiles = await db.collection('users').doc(TARGET_UID).collection('voice_profiles').get();
    console.log(`   - Voice Profiles count: ${targetProfiles.size}`);
}

inspect();
