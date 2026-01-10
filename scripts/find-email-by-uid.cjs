
const admin = require('firebase-admin');
const path = require('path');

const refinedPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(refinedPath);

const prodApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
}, 'prodApp');

const prodAuth = prodApp.auth();

async function lookup() {
    try {
        const uid = '4TytREh0UXXL2Ual1P8d4nu7q8S2';
        console.log(`Looking up UID ${uid}...`);
        const user = await prodAuth.getUser(uid);
        console.log("Found User:");
        console.log(`- Email: ${user.email}`);
        console.log(`- ID: ${user.uid}`);
        console.log(`- Name: ${user.displayName}`);
    } catch (e) {
        console.error(e);
    }
}
lookup();
