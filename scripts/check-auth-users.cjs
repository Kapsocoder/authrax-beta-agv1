const admin = require('firebase-admin');

process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'authrax-beta-lv1';

admin.initializeApp({
    projectId: 'authrax-beta-lv1',
});

async function listAllUsers(nextPageToken) {
    try {
        const listUsersResult = await admin.auth().listUsers(100, nextPageToken);
        if (listUsersResult.users.length === 0) {
            console.log('No users found in Auth Emulator.');
            return;
        }

        console.log('Users in Auth Emulator:');
        listUsersResult.users.forEach((userRecord) => {
            console.log(`- ${userRecord.email} (UID: ${userRecord.uid})`);
        });

        if (listUsersResult.pageToken) {
            listAllUsers(listUsersResult.pageToken);
        }
    } catch (error) {
        console.log('Error listing users:', error);
    }
}

listAllUsers();
