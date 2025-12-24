const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// CONFIGURATION
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '../serviceAccountKey.json'); // Path to your Firebase Service Account Key
const DATA_DIR = './data_export'; // Directory containing Supabase CSV exports

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error(`Error: Service account key not found at ${SERVICE_ACCOUNT_PATH}`);
    console.log("Please download your Service Account Key from Firebase Console -> Project Settings -> Service Accounts");
    process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT_PATH);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateCollection(csvFile, collectionName, idField = 'id', transformFn = (data) => data) {
    const filePath = path.join(DATA_DIR, csvFile);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${collectionName}: ${csvFile} not found.`);
        return;
    }

    console.log(`Migrating ${collectionName} from ${csvFile}...`);
    const batchSize = 500;
    let batch = db.batch();
    let count = 0;
    let total = 0;

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv({ separator: ';' }))
            .on('data', async (row) => {
                const data = transformFn(row);
                if (!data) return; // Skip if transform returns null

                const docId = data[idField];
                if (!docId) {
                    console.warn(`Skipping row with no ID in ${csvFile}`);
                    return;
                }

                const docRef = db.collection(collectionName).doc(docId);
                batch.set(docRef, data);
                count++;
                total++;

                if (count >= batchSize) {
                    // Commit batch
                    await batch.commit();
                    console.log(`Committed ${count} records to ${collectionName}`);
                    batch = db.batch();
                    count = 0;
                }
            })
            .on('end', async () => {
                if (count > 0) {
                    await batch.commit();
                    console.log(`Committed remaining ${count} records to ${collectionName}`);
                }
                console.log(`Finished migrating ${collectionName}. Total: ${total}`);
                resolve();
            })
            .on('error', reject);
    });
}

async function migrateUsers() {
    // Migration of auth users is complex and usually requires firebase-admin auth import.
    // This function migrates the 'profiles' table to 'users' collection in Firestore (User Data, not Auth credentials).
    // The Auth credentials must be migrated separately or users must reset passwords.

    await migrateCollection('profiles.csv', 'users', 'id', (row) => {
        return {
            id: row.id,
            email: row.email,
            full_name: row.full_name,
            avatar_url: row.avatar_url,
            user_type: row.user_type,
            onboarding_completed: row.onboarding_completed === 'true',
            created_at: row.created_at || new Date().toISOString(),
            // Map other fields...
        };
    });
}

async function main() {
    try {
        // 1. Users / Profiles
        await migrateUsers();

        // 2. Posts
        await migrateCollection('posts.csv', 'posts', 'id', (row) => {
            return {
                ...row,
                is_generated: row.is_generated === 'true',
                is_edited: row.is_edited === 'true',
                // Ensure types are correct
            };
        });

        // 3. Templates
        await migrateCollection('templates.csv', 'templates', 'id', (row) => {
            return {
                ...row,
                is_trending: row.is_trending === 'true',
                is_system: row.is_system === 'true',
                is_custom: row.is_custom === 'true',
                themes: row.themes ? row.themes.replace(/^{|}$/g, '').split(',') : [], // Handle Postgres array format {a,b}
                formats: row.formats ? row.formats.replace(/^{|}$/g, '').split(',') : [],
                objectives: row.objectives ? row.objectives.replace(/^{|}$/g, '').split(',') : [],
            };
        });

        // 4. Voice Profiles -> users/{uid}/voice_profiles/default
        // We need custom logic for subcollection
        const voiceFile = path.join(DATA_DIR, 'voice_profiles.csv');
        if (fs.existsSync(voiceFile)) {
            console.log("Migrating voice_profiles...");
            let batch = db.batch();
            let count = 0;

            const stream = fs.createReadStream(voiceFile).pipe(csv({ separator: ';' }));
            for await (const row of stream) {
                const userId = row.user_id;
                if (!userId) continue;

                const docRef = db.doc(`users/${userId}/voice_profiles/default`);
                batch.set(docRef, {
                    ...row,
                    is_trained: row.is_trained === 'true',
                    formatting_patterns: row.formatting_patterns ? row.formatting_patterns.replace(/^{|}$/g, '').split(',') : [],
                    sample_posts: row.sample_posts ? row.sample_posts.replace(/^{|}$/g, '').split(',') : [], // Might fail if JSON array vs PG array
                });
                count++;
                if (count >= 500) {
                    await batch.commit();
                    batch = db.batch();
                    count = 0;
                }
            }
            if (count > 0) await batch.commit();
            console.log("Finished voice_profiles");
        }

        // 5. Recommended Posts
        await migrateCollection('recommended_posts.csv', 'recommended_posts', 'id', (row) => ({
            ...row,
            is_used: row.is_used === 'true'
        }));

        // 6. User Topics -> users/{uid}/topics
        const userTopicsFile = path.join(DATA_DIR, 'user_topics.csv');
        if (fs.existsSync(userTopicsFile)) {
            console.log("Migrating user_topics...");
            let batch = db.batch();
            let count = 0;
            const stream = fs.createReadStream(userTopicsFile).pipe(csv({ separator: ';' }));
            for await (const row of stream) {
                const userId = row.user_id;
                if (!userId) continue;
                // Use existing ID or generate one
                const docId = row.id || db.collection('users').doc().id;
                const docRef = db.doc(`users/${userId}/topics/${docId}`);
                batch.set(docRef, row);
                count++;
                if (count >= 500) {
                    await batch.commit();
                    batch = db.batch();
                    count = 0;
                }
            }
            if (count > 0) await batch.commit();
            console.log("Finished user_topics");
        }

        // 7. Post Analytics -> posts/{postId}/analytics
        const analyticsFile = path.join(DATA_DIR, 'post_analytics.csv');
        if (fs.existsSync(analyticsFile)) {
            console.log("Migrating post_analytics...");
            let batch = db.batch();
            let count = 0;
            const stream = fs.createReadStream(analyticsFile).pipe(csv({ separator: ';' }));
            for await (const row of stream) {
                const postId = row.post_id;
                if (!postId) continue;
                const docId = row.id || db.collection('posts').doc().id;
                const docRef = db.doc(`posts/${postId}/analytics/${docId}`);
                batch.set(docRef, row);
                count++;
                if (count >= 500) {
                    await batch.commit();
                    batch = db.batch();
                    count = 0;
                }
            }
            if (count > 0) await batch.commit();
            console.log("Finished post_analytics");
        }

        // 8. Global Topics
        await migrateCollection('topics.csv', 'topics', 'id');

        // 9. Trending Cache
        await migrateCollection('trending_cache.csv', 'trending_cache', 'id');

        console.log("Migration Complete!");

    } catch (error) {
        console.error("Migration failed:", error);
    }
}

main();
