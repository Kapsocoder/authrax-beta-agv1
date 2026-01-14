const admin = require('firebase-admin');
const path = require('path');

// 1. Initialize Prod App
const refinedPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(refinedPath);

const prodApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
}, 'prodApp');
const prodDb = prodApp.firestore();

// 2. Initialize Local App
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const localApp = admin.initializeApp({
    projectId: 'authrax-beta-lv1'
}, 'localApp');
const localDb = localApp.firestore();

async function compare() {
    const uid = '4TytREh0UXXL2Ual1P8d4nu7q8S2'; // kapil's uid
    console.log(`Checking voice_profiles for ${uid}...\n`);

    // Check Prod
    const prodProfiles = await prodDb.collection(`users/${uid}/voice_profiles`).get();
    console.log(`[PROD] Found ${prodProfiles.size} profiles.`);
    prodProfiles.forEach(d => console.log(`   - ID: ${d.id}, isActive: ${d.data().isActive}, is_trained: ${d.data().is_trained}`));

    // Check Local
    const localProfiles = await localDb.collection(`users/${uid}/voice_profiles`).get();
    console.log(`\n[LOCAL] Found ${localProfiles.size} profiles.`);
    localProfiles.forEach(d => console.log(`   - ID: ${d.id}, isActive: ${d.data().isActive}, is_trained: ${d.data().is_trained}`));
}

compare();
