const admin = require('firebase-admin');
const path = require('path');

// ==========================================
// 1. configuration
// ==========================================
const SOURCE_USER_ID = '4TytREh0UXXL2Ual1P8d4nu7q8S2'; // kapil_sabharwal@yahoo.com
// We want to sync the whole DB, but we will pay special attention to this user for the patches.
// Actually, let's sync EVERYTHING, but apply patches where needed.

// ==========================================
// 2. Initialize Apps
// ==========================================

// PROD (Source)
const refinedPath = path.resolve(__dirname, '../serviceAccountKey.json');
const serviceAccount = require(refinedPath);

// TEMP: Remove Emulator Env Var so Prod App connects to Real Cloud
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIRESTORE_EMULATOR_HOST;

const prodApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
}, 'prodApp');
const prodDb = prodApp.firestore();

// RESTORE: Put it back for Local App
if (emulatorHost) {
    process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
}

// LOCAL (Destination)
if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}
if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
}
const localApp = admin.initializeApp({
    projectId: 'authrax-beta-lv1'
}, 'localApp');
const localDb = localApp.firestore();

console.log("DEBUG: FIRESTORE_EMULATOR_HOST =", process.env.FIRESTORE_EMULATOR_HOST);
console.log("DEBUG: FIREBASE_AUTH_EMULATOR_HOST =", process.env.FIREBASE_AUTH_EMULATOR_HOST);

// ==========================================
// 3. Helper Functions
// ==========================================

// Helper to sanitize data for Dev requirements
function transmogrifyData(collectionPath, docId, data) {
    // CLONE data to avoid mutating original
    const newData = { ...data };

    // RULE 1: Voice Profiles
    if (collectionPath.includes('voice_profiles')) {
        // Fix: is_trained
        // Logic: If it has analysis_summary or is marked active, assume it should be trained for Dev purposes
        // OR simply force it if it looks like a profile.
        // The specific profile 8WX1... is known to be active.
        if (data.isActive) {
            newData.is_trained = true;
            console.log(`   🛠️ [PATCH] Set is_trained=true for active profile ${docId}`);
        }

        // Fix: created_at (Missing in prod data, required for sorting)
        if (!newData.created_at) {
            // Fallback to a valid timestamp if missing
            newData.created_at = new Date().toISOString();
            console.log(`   🛠️ [PATCH] Set default created_at for ${docId}`);
        }
    }

    return newData;
}

// Recursive Copy Function
async function copyCollectionRecursive(srcRef, destRef) {
    const snapshot = await srcRef.get();
    if (snapshot.empty) return;

    console.log(`📂 Processing ${srcRef.path} (${snapshot.size} docs)...`);

    const batchSize = 400;
    let batch = localDb.batch();
    let count = 0;

    for (const doc of snapshot.docs) {
        const sourceData = doc.data();

        // APPLY DEV ENHANCEMENTS
        const finalData = transmogrifyData(srcRef.path, doc.id, sourceData);

        batch.set(destRef.doc(doc.id), finalData);
        count++;

        if (count >= batchSize) {
            await batch.commit();
            batch = localDb.batch();
            count = 0;
            process.stdout.write('.');
        }

        // RECURSE: List Subcollections
        // Note: listCollections() works on the DocumentReference
        const subCollections = await doc.ref.listCollections();
        for (const subCol of subCollections) {
            await copyCollectionRecursive(subCol, destRef.doc(doc.id).collection(subCol.id));
        }
    }

    if (count > 0) {
        await batch.commit();
    }
}

// ==========================================
// 4. Main Execution
// ==========================================
async function run() {
    try {
        console.log("🚀 Starting COMPLETE DB SYNC (Prod -> Local)...");
        console.log("   Format: 'Exact Schema + Dev Enhancements'");

        // 1. Get Root Collections
        const rootCollections = await prodDb.listCollections();
        const colsToCopy = rootCollections.filter(c => c.id !== 'trending_cache'); // Skip huge cache

        console.log(`Found ${colsToCopy.length} root collections to sync.`);

        for (const coll of colsToCopy) {
            await copyCollectionRecursive(coll, localDb.collection(coll.id));
        }

        console.log("\n✅ Sync Complete in memory.");

        // FORCE SAVE TO DISK via Emulator Hub API
        try {
            console.log("💾 Forcing explicit save to ./emulator-data...");
            const exportPath = path.resolve(__dirname, '../emulator-data');

            console.log("DEBUG: FIREBASE_EMULATOR_HUB =", process.env.FIREBASE_EMULATOR_HUB);

            const tryExport = async (hostAndPort) => {
                if (!hostAndPort) return false;
                try {
                    const url = `http://${hostAndPort}/emulators/export`;
                    console.log(`   Trying Export API at: ${url}`);
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ path: exportPath })
                    });
                    if (response.ok) {
                        console.log(`✅ Data successfully exported to disk via Hub API.`);
                        return true;
                    }
                    console.warn(`   API responded with: ${await response.text()}`);
                    return false;
                } catch (e) {
                    console.warn(`   Fetch error: ${e.message}`);
                    return false;
                }
            };

            // Priority 1: Env Var (The standard way inside exec)
            let success = await tryExport(process.env.FIREBASE_EMULATOR_HUB);

            // Priority 2: Guessing
            if (!success) {
                console.log("   Env Var failed/missing. Guessing ports...");
                if (!await tryExport('127.0.0.1:4400')) {
                    if (!await tryExport('127.0.0.1:4401')) {
                        console.error("❌ Could not contact Emulator Hub for export.");
                    }
                }
            }

        } catch (saveError) {
            console.error("Save Error:", saveError);
        }

        console.log("🏁 Process Finished.");

    } catch (error) {
        console.error("❌ Sync Failed:", error);
    }
}

run();
