const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
// Assuming the environment has ADC or is authenticated via `gcloud auth application-default login`
// If not, this might fail, but it's worth a try.
if (admin.apps.length === 0) {
    admin.initializeApp({
        projectId: 'authrax-beta-lv1'
    });
}

const db = getFirestore();

async function inspectProfile() {
    const userId = '4TytREh0UXXL2Ual1P8d4nu7q8S2';
    console.log(`Inspecting voice profiles for user: ${userId}`);

    try {
        const snapshot = await db.collection(`users/${userId}/voice_profiles`).get();

        if (snapshot.empty) {
            console.log('No voice profiles found.');
            return;
        }

        console.log(`Found ${snapshot.size} profiles.`);

        snapshot.forEach(doc => {
            console.log('\n---------------------------------------------------');
            console.log(`Document ID: ${doc.id}`);
            const data = doc.data();

            // Log specific fields we care about
            console.log('isActive:', data.isActive);
            console.log('is_trained:', data.is_trained);
            console.log('created_at:', data.created_at);

            // Check if there are other relevant fields
            console.log('Fields present:', Object.keys(data).join(', '));
            console.log('---------------------------------------------------\n');
        });

    } catch (error) {
        console.error('Error fetching voice profiles:', error);
    }
}

inspectProfile();
