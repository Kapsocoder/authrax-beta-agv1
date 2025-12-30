const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// INSTRUCTIONS:
// 1. Ensure you are authenticated. Run:
//    gcloud auth application-default login
//    OR
//    Set GOOGLE_APPLICATION_CREDENTIALS to your service account key path.
// 2. Run this script:
//    node export_templates.js

try {
    admin.initializeApp();
} catch (e) {
    console.log("Initialization check:", e.message);
}

const db = admin.firestore();

async function extractTemplates() {
    console.log("Starting export of 'templates' collection...");
    try {
        const snapshot = await db.collection('templates').get();
        if (snapshot.empty) {
            console.log('No documents found.');
            return;
        }

        console.log(`Found ${snapshot.size} documents.`);
        const templates = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Convert timestamps
            const serialized = {};
            for (const [k, v] of Object.entries(data)) {
                if (v && typeof v.toDate === 'function') {
                    serialized[k] = v.toDate().toISOString();
                } else {
                    serialized[k] = v;
                }
            }
            templates.push({ id: doc.id, ...serialized });
        });

        const outputPath = path.join(__dirname, '..', 'templates_data.json');
        fs.writeFileSync(outputPath, JSON.stringify(templates, null, 2));
        console.log(`Success! Exported ${templates.length} templates to:`);
        console.log(outputPath);

    } catch (error) {
        console.error("Error exporting templates:", error);
        console.error("\nPossible fix: Run 'gcloud auth application-default login' before running this script.");
    }
}

extractTemplates();
