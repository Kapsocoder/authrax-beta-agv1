const admin = require('firebase-admin');
const path = require('path');

// 1. Initialize Prod App
const refinedPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(refinedPath);

const prodApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
}, 'prodApp');
const prodDb = prodApp.firestore();

async function testTraversal() {
    const uid = '4TytREh0UXXL2Ual1P8d4nu7q8S2';
    console.log(`Testing listCollections() for user ${uid} in PROD...`);

    const userRef = prodDb.collection('users').doc(uid);
    const subcols = await userRef.listCollections();

    console.log(`Found ${subcols.length} subcollections.`);
    subcols.forEach(col => console.log(` - ${col.id}`));

    if (subcols.length === 0) {
        console.log("WARNING: No subcollections found. Check permissions or data existence.");
    }
}

testTraversal();
