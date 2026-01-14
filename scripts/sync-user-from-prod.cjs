
const admin = require('firebase-admin');
const path = require('path');

// 1. Initialize Prod App (Source)
const refinedPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(refinedPath);

const prodApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
}, 'prodApp');

const prodAuth = prodApp.auth();

// 2. Initialize Local Emulator App (Destination)
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
const localApp = admin.initializeApp({
    projectId: 'authrax-beta-lv1'
}, 'localApp');

const localAuth = localApp.auth();

const EMAIL = 'kapil_sabharwal@yahoo.com';
const PASSWORD = 'password123';

async function syncUser() {
    try {
        console.log(`\n🔍 Looking up ${EMAIL} in Production...`);
        let prodUser;
        try {
            prodUser = await prodAuth.getUserByEmail(EMAIL);
        } catch (e) {
            if (e.code === 'auth/user-not-found') {
                console.error(`❌ User ${EMAIL} does not exist in Production! Cannot sync.`);
                process.exit(1);
            }
            throw e;
        }

        console.log(`   Found Prod UID: ${prodUser.uid}`);

        // Check for existing local user
        try {
            const localUser = await localAuth.getUserByEmail(EMAIL);
            console.log(`⚠️ Found local user ${EMAIL} with UID: ${localUser.uid}`);

            if (localUser.uid === prodUser.uid) {
                console.log("   ✅ UID already matches Prod. Nothing to do.");
                return;
            }

            console.log("   🗑️ Deleting local user with mismatching UID...");
            await localAuth.deleteUser(localUser.uid);
            console.log("   ✅ Deleted.");
        } catch (e) {
            if (e.code !== 'auth/user-not-found') throw e;
            console.log("   Info: User does not exist locally yet.");
        }

        // Create with Prod UID
        console.log(`\n🆕 Creating local user with Prod UID: ${prodUser.uid}...`);
        await localAuth.createUser({
            uid: prodUser.uid,
            email: EMAIL,
            password: PASSWORD,
            emailVerified: true,
            displayName: prodUser.displayName,
            photoURL: prodUser.photoURL
        });

        console.log(`✅ Success! You can login as ${EMAIL} / ${PASSWORD} and you will see your Prod data.`);

    } catch (error) {
        console.error("Sync failed:", error);
    }
}

syncUser();
