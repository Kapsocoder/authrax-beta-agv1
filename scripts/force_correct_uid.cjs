
const admin = require('firebase-admin');

// Point to Local Emulators
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.GCLOUD_PROJECT = 'authrax-beta-lv1';

const app = admin.initializeApp({
    projectId: 'authrax-beta-lv1'
});

const auth = app.auth();

const EMAIL = 'kapil_sabharwal@yahoo.com';
const PROD_UID = '4TytREh0UXXL2Ual1P8d4nu7q8S2';
const PASSWORD = 'password123';

async function forceCorrectUid() {
    try {
        console.log(`Looking for user ${EMAIL}...`);
        try {
            const user = await auth.getUserByEmail(EMAIL);
            console.log(`Found user ${EMAIL} with UID: ${user.uid}`);

            if (user.uid === PROD_UID) {
                console.log('✅ UID is already correct. No action needed.');
                return;
            }

            console.log('⚠️ UID mismatch. Deleting old user...');
            await auth.deleteUser(user.uid);
            console.log('Deleted.');

        } catch (error) {
            if (error.code !== 'auth/user-not-found') throw error;
            console.log('User does not exist yet.');
        }

        console.log(`Creating user with correct UID: ${PROD_UID}...`);
        await auth.createUser({
            uid: PROD_UID,
            email: EMAIL,
            password: PASSWORD,
            emailVerified: true
        });
        console.log('✅ User created successfully with Production UID.');

    } catch (error) {
        console.error('Error:', error);
    }
}

forceCorrectUid();
