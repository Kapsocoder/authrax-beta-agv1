import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName, photoURL } = user;

    const userRef = db.collection('users').doc(uid);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
        await userRef.set({
            user_id: uid,
            email: email,
            full_name: displayName || null,
            avatar_url: photoURL || null,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
            onboarding_completed: false,
            subscription_tier: 'free',
            voice_analysis_count: 0,
            weekly_usage: {
                count: 0,
                start_date: new Date().toISOString()
            }
        });
        console.log(`Initialized User Profile for ${uid}`);
    }
});
