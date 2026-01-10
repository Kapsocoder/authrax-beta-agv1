const admin = require('firebase-admin');
const path = require('path');

// Initialize Admin SDK for Emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.PUBSUB_EMULATOR_HOST = 'localhost:8085';

const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'authrax-beta-lv1',
});

const db = admin.firestore();

const UID = '4TytREh0UXXL2Ual1P8d4nu7q8S2'; // The synced production UID

async function debugVoiceProfiles() {
    console.log(`Fetching voice_profiles for user: ${UID}`);

    const profilesRef = db.collection('users').doc(UID).collection('voice_profiles');
    const snapshot = await profilesRef.get();

    if (snapshot.empty) {
        console.log('No voice profiles found.');
        return;
    }

    console.log(`Found ${snapshot.size} profiles:\n`);

    snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`[ID: ${doc.id}]`);
        console.log(`  is_trained: ${data.is_trained} (${typeof data.is_trained})`);
        console.log(`  isActive: ${data.isActive} (${typeof data.isActive})`);
        console.log(`  version: ${data.version}`);
        console.log(`  created_at: ${data.created_at ? data.created_at.toDate() : 'N/A'}`);
        console.log('---');
    });
}

debugVoiceProfiles().catch(console.error);
