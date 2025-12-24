import admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'authrax-beta-lv1'
    });
}
const db = admin.firestore();

async function verify() {
    console.log('Verifying template acronym replacement...');
    const snapshot = await db.collection('templates').limit(5).get();
    if (snapshot.empty) {
        console.log('No templates found.');
        return;
    }

    snapshot.docs.forEach(doc => {
        console.log(`\nTemplate: ${doc.data().name} (${doc.id})`);
        console.log('Themes:', JSON.stringify(doc.data().themes));
        console.log('Formats:', JSON.stringify(doc.data().formats));
        console.log('Objectives:', JSON.stringify(doc.data().objectives));
    });
}

verify();
