
const admin = require('firebase-admin');

// Set environment variable to point to emulator
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.GCLOUD_PROJECT = 'authrax-beta-lv1';

admin.initializeApp({
    projectId: 'authrax-beta-lv1'
});

const email = 'kapil_sabharwal@yahoo.com';
const password = 'password123';

async function seedUser() {
    try {
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            console.log('User already exists:', userRecord.uid);
            // Optional: Update password to ensure it matches
            await admin.auth().updateUser(userRecord.uid, { password });
            console.log('Password updated/verified for existing user.');
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                const userRecord = await admin.auth().createUser({
                    email,
                    password,
                    emailVerified: true
                });
                console.log('Successfully created new user:', userRecord.uid);
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error seeding user:', error);
    }
}

seedUser();
