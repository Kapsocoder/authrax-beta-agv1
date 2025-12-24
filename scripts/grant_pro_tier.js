import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'authrax-beta-lv1'
    });
}
const db = admin.firestore();

const TARGET_UID = '4TytREh0UXXL2Ual1P8d4nu7q8S2';
const TARGET_EMAIL = 'kapil_sabharwal@yahoo.com';

async function grantProTier() {
    console.log(`Granting PRO tier to user: ${TARGET_EMAIL} (${TARGET_UID})`);

    const userRef = db.collection('users').doc(TARGET_UID);

    try {
        const doc = await userRef.get();

        if (!doc.exists) {
            console.log('User document does not exist. Creating new document...');
            await userRef.set({
                email: TARGET_EMAIL,
                subscription_tier: 'pro',
                created_at: admin.firestore.FieldValue.serverTimestamp(),
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            console.log('User document exists. Updating subscription_tier...');
            await userRef.set({
                subscription_tier: 'pro',
                updated_at: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        console.log('SUCCESS: User is now on PRO tier.');

    } catch (error) {
        console.error('ERROR updating user:', error);
    }
}

grantProTier();
