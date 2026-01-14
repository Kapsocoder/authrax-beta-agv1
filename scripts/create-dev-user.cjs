
const admin = require('firebase-admin');

// Point to Local Emulators
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

const localApp = admin.initializeApp({
    projectId: 'authrax-beta-lv1'
}, 'localApp');

const auth = localApp.auth();

async function createUser(email, password) {
    try {
        console.log(`Creating user ${email}...`);
        const user = await auth.createUser({
            email: email,
            password: password,
            emailVerified: true
        });
        console.log(`✅ Successfully created new user: ${user.uid}`);
    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            console.log(`⚠️ User ${email} already exists. Fetching info...`);
            const user = await auth.getUserByEmail(email);
            console.log(`   UID: ${user.uid}`);
        } else {
            console.error('Error creating user:', error);
        }
    }
}

createUser('kapil_sabharwal@yahoo.com', 'password123');
