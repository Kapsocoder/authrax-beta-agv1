
const admin = require('firebase-admin');
const path = require('path');

// 1. Initialize Prod App (Source)
const refinedPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(refinedPath);

const prodApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
}, 'prodApp');

const prodDb = prodApp.firestore();

// 2. Initialize Local Emulator App (Destination)
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
const localApp = admin.initializeApp({
    projectId: 'authrax-beta-lv1'
}, 'localApp');

const localDb = localApp.firestore();

async function copyCollection(srcCollRef, destCollRef) {
    const snapshot = await srcCollRef.get();
    if (snapshot.empty) return;

    console.log(`\n📦 Copying ${srcCollRef.path} (${snapshot.size} docs)...`);

    const batchSize = 400;
    let batch = localDb.batch();
    let count = 0;
    let totalCopied = 0;

    for (const doc of snapshot.docs) {
        batch.set(destCollRef.doc(doc.id), doc.data());
        count++;
        if (count >= batchSize) {
            await batch.commit();
            totalCopied += count;
            batch = localDb.batch();
            count = 0;
            process.stdout.write('.');
        }

        // Recursively copy subcollections for this document
        const subCollections = await doc.ref.listCollections();
        for (const subCol of subCollections) {
            await copyCollection(subCol, destCollRef.doc(doc.id).collection(subCol.id));
        }
    }

    if (count > 0) {
        await batch.commit();
        totalCopied += count;
    }
    console.log(`   ✅ Finished ${srcCollRef.path}`);
}

async function run() {
    try {
        console.log("🚀 Starting Optimized Data Sync (Prod -> Local Emulator)...");

        // Dynamically list all root collections
        const rootCollections = await prodDb.listCollections();
        // SKIP trending_cache as it is huge and not needed for schema correctness (it's cache)
        const colsToCopy = rootCollections.filter(c => c.id !== 'trending_cache');

        console.log(`Found ${colsToCopy.length} root collections (skipping trending_cache): ${colsToCopy.map(c => c.id).join(', ')}`);

        for (const coll of colsToCopy) {
            await copyCollection(coll, localDb.collection(coll.id));
        }

        console.log("\n✨ Full Schema Sync Complete!");
    } catch (error) {
        console.error("Sync failed:", error);
    }
}

run();
