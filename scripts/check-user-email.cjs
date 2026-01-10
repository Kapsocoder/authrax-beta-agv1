const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const localApp = admin.initializeApp({
    projectId: 'authrax-beta-lv1'
}, 'localApp');

const db = localApp.firestore();

async function checkUser() {
    const uid = '4TytREh0UXXL2Ual1P8d4nu7q8S2';
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
        console.log(`User ${uid} data:`, doc.data());
        console.log(`Email check: ${doc.data().email}`);
    } else {
        console.log(`User ${uid} not found in Firestore.`);
    }
}

checkUser();
