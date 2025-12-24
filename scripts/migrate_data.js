import admin from 'firebase-admin';
import { createReadStream } from 'fs';
import csv from 'csv-parser';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize Firebase Admin
// We attempt to initialize with default credentials.
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: 'authrax-beta-lv1'
        });
        console.log('Firebase Admin Initialized.');
    } catch (error) {
        console.error('Failed to initialize Firebase Admin. Ensure GOOGLE_APPLICATION_CREDENTIALS is set or you are logged in via gcloud.');
        process.exit(1);
    }
}

const db = admin.firestore();

// Helper to parse CSV
function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        createReadStream(filePath)
            .pipe(csv({ separator: ';' }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

// Helper to chunk array
function chunk(arr, size) {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );
}

// Helper to commit batch
async function commitBatch(collectionName, docs, docIdField = 'id', subCollectionPathFn = null) {
    const batches = chunk(docs, 500);
    let totalCommitted = 0;

    console.log(`Migrating ${docs.length} documents to ${collectionName}...`);

    for (const batchDocs of batches) {
        const batch = db.batch();

        for (const docData of batchDocs) {
            let ref;
            if (subCollectionPathFn) {
                // For subcollections (e.g. users/{uid}/topics/{id})
                const path = subCollectionPathFn(docData);
                ref = db.doc(path);
            } else {
                // For root collections
                if (docData[docIdField]) {
                    ref = db.collection(collectionName).doc(docData[docIdField]);
                } else {
                    ref = db.collection(collectionName).doc();
                }
            }
            // Clean undefined values
            const cleanData = Object.fromEntries(
                Object.entries(docData).filter(([_, v]) => v !== undefined && v !== '')
            );

            // Special handling for some fields moved to caller logic or handled here?
            // See 'cleanData' might remove fields we need if they are empty strings but mapped.

            // To be safe, we use docData processed by caller.
            batch.set(ref, docData, { merge: true });
        }

        await batch.commit();
        totalCommitted += batchDocs.length;
        console.log(`Committed ${totalCommitted}/${docs.length}`);
    }
}

async function migratePosts() {
    const filePath = join(__dirname, '../data_export/posts.csv');
    const rows = await parseCSV(filePath);

    // Quality Filter: Remove test posts
    const validRows = rows.filter(row => {
        const content = (row.content || '').toLowerCase();
        if (content.includes('this is a test')) return false;
        if (content.includes('draught draught')) return false;
        return true;
    });

    console.log(`Filtered out ${rows.length - validRows.length} test/garbage posts.`);

    const processed = validRows.map(row => {
        return {
            ...row,
            user_id: row.user_id?.trim(),
            content: row.content?.trim(),
            // Convert empty strings to null for nullable fields
            scheduled_for: row.scheduled_for ? row.scheduled_for : null,
            published_at: row.published_at ? row.published_at : null,
            linkedin_post_id: row.linkedin_post_id ? row.linkedin_post_id : null,
            ai_prompt: row.ai_prompt ? row.ai_prompt : null,

            is_ai_generated: row.is_ai_generated === 'true',
        };
    });

    await commitBatch('posts', processed);
}

const MAPPINGS = {
    themes: {
        'PCD': 'Personal/Career Development',
        'TL': 'Industry Insight/Thought Leadership',
        'PSS': 'Product/Service/Solution',
        'SP': 'Social Proof/Success Stories',
        'CC': 'Company Culture/Recruitment',
        'CR': 'Corporate/Investor Relations',
        'EC': 'Engagement/Community',
        'AE': 'Audience Education/Value'
    },
    formats: {
        'T': 'Text-Only/Text with Image',
        'I': 'Image/Photo',
        'V': 'Video/GIF',
        'C': 'Carousel/Document (PDF)',
        'Po': 'Poll',
        'A': 'Long-Form Article'
    },
    objectives: {
        'PB': 'Personal Branding/Authority',
        'NB': 'Networking/Community Building',
        'LG': 'Lead Generation/Sales',
        'TA': 'Talent Acquisition/Employer Branding',
        'RM': 'Reputation Management/Trust',
        'AE': 'Audience Education/Value'
    }
};

async function migrateTemplates() {
    const filePath = join(__dirname, '../data_export/templates.csv');
    const rows = await parseCSV(filePath);

    const processed = rows.map(row => {
        try {
            const themes = row.themes ? JSON.parse(row.themes) : [];
            const formats = row.formats ? JSON.parse(row.formats) : [];
            const objectives = row.objectives ? JSON.parse(row.objectives) : [];

            return {
                ...row,
                themes: themes.map(t => MAPPINGS.themes[t] || t),
                formats: formats.map(f => MAPPINGS.formats[f] || f),
                objectives: objectives.map(o => MAPPINGS.objectives[o] || o),
                example: row.example ? row.example : null,
                is_trending: row.is_trending === 'true',
                is_custom: row.is_custom === 'true',
                is_system: row.is_system === 'true',
            };
        } catch (e) {
            console.warn(`Failed to parse JSON for template ${row.id}`, e);
            // Return row but with empty arrays for failed parses to ensure valid structure
            return {
                ...row,
                themes: [],
                formats: [],
                objectives: [],
                is_trending: row.is_trending === 'true',
                is_custom: row.is_custom === 'true',
                is_system: row.is_system === 'true',
            };
        }
    });

    await commitBatch('templates', processed);
}


async function migrateRecommendedPosts() {
    const filePath = join(__dirname, '../data_export/recommended_posts.csv');
    const rows = await parseCSV(filePath);

    const processed = rows.map(row => ({
        ...row,
        source_url: row.source_url ? row.source_url : null,
        source_title: row.source_title ? row.source_title : null,
        is_used: row.is_used === 'true',
    }));

    await commitBatch('recommended_posts', processed);
}

async function migrateUserTopics() {
    const filePath = join(__dirname, '../data_export/user_topics.csv');
    // Check if file has data - handled by parseCSV returning empty array
    // if (!require('fs').statSync(filePath).size) return;

    const rows = await parseCSV(filePath);
    if (rows.length === 0) return;

    const processed = rows.map(row => ({
        ...row,
        is_active: row.is_active === 'true',
    }));

    await commitBatch('users', processed, 'id', (row) => `users/${row.user_id}/topics/${row.id}`);
}

async function migrateTrendingCache() {
    const filePath = join(__dirname, '../data_export/trending_cache.csv');
    const rows = await parseCSV(filePath);
    if (rows.length === 0) return;

    // trending_cache map
    await commitBatch('trending_cache', rows);
}

async function migratePostAnalytics() {
    const filePath = join(__dirname, '../data_export/post_analytics.csv');
    const rows = await parseCSV(filePath);
    if (rows.length === 0) return;

    await commitBatch('post_analytics', rows);
}


// Helper to clear collection
async function clearDatabase() {
    console.log('Clearing existing database collections...');
    const collections = [
        'posts',
        'templates',
        'recommended_posts',
        'trending_cache',
        'post_analytics',
        'users' // Wiping users collection too as requested for clean slate
    ];

    for (const collectionName of collections) {
        const ref = db.collection(collectionName);
        console.log(`Deleting collection: ${collectionName}...`);
        await db.recursiveDelete(ref);
        console.log(`Deleted ${collectionName}.`);
    }
    console.log('Database cleared.');
}

async function run() {
    try {
        await clearDatabase(); // Clear first

        console.log('Starting migration...');

        await migratePosts();
        await migrateTemplates();
        await migrateRecommendedPosts();
        await migrateUserTopics();
        await migrateTrendingCache();
        await migratePostAnalytics();

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

run();
