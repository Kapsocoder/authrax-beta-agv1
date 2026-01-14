const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const localApp = admin.initializeApp({
    projectId: 'authrax-beta-lv1'
}, 'localApp');
const localDb = localApp.firestore();

async function checkLocalProfiles() {
    const uid = '4TytREh0UXXL2Ual1P8d4nu7q8S2';
    console.log(`Checking LOCAL voice_profiles for ${uid}...`);

    const snapshot = await localDb.collection(`users/${uid}/voice_profiles`).get();
    if (snapshot.empty) {
        console.log("❌ No voice profiles found locally.");
        return;
    }

    console.log(`Found ${snapshot.size} profiles:`);
    snapshot.forEach(doc => {
        const d = doc.data();
        console.log(` - ID: ${doc.id}`);
        console.log(`   isActive: ${d.isActive}`);
        console.log(`   is_trained: ${d.is_trained} (${typeof d.is_trained})`);
        console.log(`   created_at: ${d.created_at}`);
    });
}

checkLocalProfiles();
