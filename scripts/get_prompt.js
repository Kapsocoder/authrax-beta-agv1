
import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const userId = "4TytREh0UXXL2Ual1P8d4nu7q8S2";

async function fetchPrompt() {
    const doc = await db.collection('users').doc(userId).collection('voice_profiles').doc('default').get();
    if (doc.exists) {
        console.log("System Prompt:");
        console.log(doc.data().system_prompt || "No system prompt found.");
        console.log("Updated At:", doc.data().updated_at);
    } else {
        console.log("No profile found.");
    }
}

fetchPrompt();
