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

async function syncVoiceProfiles() {
    const uid = '4TytREh0UXXL2Ual1P8d4nu7q8S2';
    console.log(`Syncing voice_profiles for ${uid} from PROD to LOCAL...`);

    const srcCollRef = prodDb.collection(`users/${uid}/voice_profiles`);
    const snapshot = await srcCollRef.get();

    if (snapshot.empty) {
        console.log('No profiles found in Prod.');
        return;
    }

    const batch = localDb.batch();
    let count = 0;

    snapshot.forEach(doc => {
        const destRef = localDb.collection(`users/${uid}/voice_profiles`).doc(doc.id);
        batch.set(destRef, doc.data());
        count++;
    });

    await batch.commit();
    console.log(`✅ Successfully synced ${count} voice profiles.`);
}

syncVoiceProfiles();
