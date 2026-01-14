const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const localApp = admin.initializeApp({
    projectId: 'authrax-beta-lv1'
}, 'localApp');
const localDb = localApp.firestore();

async function patchProfile() {
    const uid = '4TytREh0UXXL2Ual1P8d4nu7q8S2';
    const profileId = '8WX1QoaqpISZ4aKxjhj2'; // The one with isActive: true

    console.log(`Patching profile ${profileId} for user ${uid}...`);

    // Explicitly set is_trained to true to match the query expectations
    await localDb.doc(`users/${uid}/voice_profiles/${profileId}`).update({
        is_trained: true
    });

    console.log('✅ Patched is_trained: true');
}

patchProfile();
