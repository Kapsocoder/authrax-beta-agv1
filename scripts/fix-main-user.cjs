
const admin = require('firebase-admin');
const path = require('path');

// 1. Initialize Prod App (Source) - Only used for init, we skip reading
const refinedPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(refinedPath);

const prodApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
}, 'prodApp');

// 2. Initialize Local Emulator App (Destination)
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
const localApp = admin.initializeApp({
    projectId: 'authrax-beta-lv1'
}, 'localApp');

const localAuth = localApp.auth();

const EMAIL = 'kapil_sabharwal@yahoo.com'; // Corrected email
const PASSWORD = 'password123';

async function fixUser() {
    const PROD_UID = '4TytREh0UXXL2Ual1P8d4nu7q8S2';

    try {
        console.log(`\n🔧 Fixing local user ${EMAIL}...`);
        console.log(`   Target UID to match Prod Data: ${PROD_UID}`);

        // Check for existing local user
        try {
            const localUser = await localAuth.getUserByEmail(EMAIL);
            console.log(`⚠️ Found local user ${EMAIL} with UID: ${localUser.uid}`);

            if (localUser.uid !== PROD_UID) {
                console.log("   🗑️ UIDs mismatch! Deleting local user...");
                await localAuth.deleteUser(localUser.uid);
            } else {
                console.log("   ✅ UIDs match. Updating password...");
                await localAuth.updateUser(localUser.uid, { password: PASSWORD });
                console.log("   ✅ Password updated.");
                return;
            }
        } catch (e) {
            if (e.code !== 'auth/user-not-found') throw e;
            console.log("   Info: User does not exist locally yet.");
        }

        // Create with Prod UID
        console.log(`\n🆕 Creating local user with Target UID: ${PROD_UID}...`);
        await localAuth.createUser({
            uid: PROD_UID,
            email: EMAIL,
            password: PASSWORD,
            emailVerified: true,
            displayName: "Kapil Sabharwal"
        });

        console.log(`✅ Success! Login as ${EMAIL} / ${PASSWORD}`);

    } catch (error) {
        console.error("Fix failed:", error);
    }
}

fixUser();
