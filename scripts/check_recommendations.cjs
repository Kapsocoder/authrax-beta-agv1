const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
    console.log('Checking recommended_posts...');
    try {
        const snapshot = await db.collection('recommended_posts')
            .orderBy('created_at', 'desc')
            .limit(5)
            .get();

        console.log(`Found ${snapshot.size} posts.`);
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id}`);
            console.log(`User: ${data.user_id}`);
            console.log(`Created: ${data.created_at}`);
            console.log(`Expires: ${data.expires_at}`);
            console.log(`Used: ${data.is_used}`);
            console.log('---');
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

check();
