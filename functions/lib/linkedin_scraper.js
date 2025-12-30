"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncLinkedInProfileHandler = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Dependencies are lazy-loaded inside the function
const db = admin.firestore();
const syncLinkedInProfileHandler = async (data, context) => {
    var _a, _b;
    // 1. Auth Check - strict
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }
    const userId = context.auth.uid;
    const { mode } = data; // 'profile' or 'posts'
    // Get user's LinkedIn URL from profile
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    const linkedinUrl = (userData === null || userData === void 0 ? void 0 : userData.linkedin_profile_url) || (userData === null || userData === void 0 ? void 0 : userData.linkedinUrl) || ((_a = userData === null || userData === void 0 ? void 0 : userData.profile) === null || _a === void 0 ? void 0 : _a.linkedinUrl);
    if (!linkedinUrl) {
        throw new functions.https.HttpsError('failed-precondition', 'No LinkedIn URL found in profile. Please add it first.');
    }
    console.log(`[SyncProfile] Starting sync for user ${userId}, mode: ${mode}, URL: ${linkedinUrl}`);
    // Basic URL validation
    if (!linkedinUrl.includes("linkedin.com/in/")) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid LinkedIn URL. Must be a profile URL.');
    }
    let browser = null;
    try {
        console.log(`[SyncProfile] Launching Puppeteer...`);
        // Lazy load dependencies to prevent global cold-start crashes
        const chromium = require('@sparticuz/chromium');
        const puppeteer = require('puppeteer-core');
        // 2. Launch Puppeteer with robust args
        browser = await puppeteer.launch({
            args: [
                ...chromium.args,
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless
        });
        console.log(`[SyncProfile] Browser launched. New page...`);
        const page = await browser.newPage();
        // Optimize: Block resources
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            }
            else {
                req.continue();
            }
        });
        // Stealth basics
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
        });
        console.log(`[SyncProfile] Navigating to ${linkedinUrl}...`);
        // Navigate with explicit error handling & race
        try {
            // Race condition: 20s timeout or load
            await Promise.race([
                page.goto(linkedinUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Page load timeout')), 20000))
            ]);
            console.log(`[SyncProfile] Navigation completed (or DOMContentLoaded).`);
        }
        catch (e) {
            console.warn(`[SyncProfile] Navigation warning (proceeding anyway): ${e.message}`);
        }
        // Wait a bit for dynamic content, but less aggressive
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`[SyncProfile] Waited for hydration.`);
        // Check if we hit authwall
        // Often LinkedIn redirects to a login page or "Join to view full profile"
        // We will try our best to get what's visible in public schema or meta tags
        const result = { success: true };
        if (mode === 'profile') {
            // Extract Basics
            const profileData = await page.evaluate(() => {
                var _a, _b, _c, _d, _e, _f, _g;
                // Try json+ld if available (often on public profiles)
                let bio = "";
                let headline = "";
                let fullName = "";
                // Meta tags strategy
                const metaDesc = document.querySelector('meta[property="og:description"]');
                if (metaDesc)
                    bio = metaDesc.content;
                const metaTitle = document.querySelector('meta[property="og:title"]');
                if (metaTitle) {
                    // Title usually "Name - Headline - Location | LinkedIn"
                    const parts = metaTitle.content.split(" - ");
                    if (parts.length >= 1)
                        fullName = parts[0];
                    if (parts.length >= 2)
                        headline = parts[1];
                }
                // Fallback: visible content
                // This is brittle as classes change, but we try common structure
                if (!fullName) {
                    const h1 = document.querySelector('h1');
                    if (h1)
                        fullName = ((_a = h1.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                    // Try another common pattern for public profiles (top-card-layout is frequent on guest view)
                    if (!fullName) {
                        const titleElem = document.querySelector('.top-card-layout__title');
                        if (titleElem)
                            fullName = ((_b = titleElem.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || "";
                    }
                    if (!fullName) {
                        const largeHeading = document.querySelector('.text-heading-xlarge');
                        if (largeHeading)
                            fullName = ((_c = largeHeading.textContent) === null || _c === void 0 ? void 0 : _c.trim()) || "";
                    }
                }
                if (!headline) {
                    const subtitle = document.querySelector('.top-card-layout__headline');
                    if (subtitle)
                        headline = ((_d = subtitle.textContent) === null || _d === void 0 ? void 0 : _d.trim()) || "";
                }
                if (!headline) {
                    const bodyMedium = document.querySelector('.text-body-medium.break-words');
                    if (bodyMedium)
                        headline = ((_e = bodyMedium.textContent) === null || _e === void 0 ? void 0 : _e.trim()) || "";
                }
                // Bio / About Strategy
                if (!bio) {
                    const aboutAnchor = document.querySelector('#about');
                    if (aboutAnchor) {
                        // Traverse up to section
                        let parent = aboutAnchor.parentElement;
                        // Safety depth check
                        for (let i = 0; i < 5 && parent; i++) {
                            if (parent.tagName === 'SECTION')
                                break;
                            parent = parent.parentElement;
                        }
                        if (parent) {
                            const inlineText = parent.querySelector('.inline-show-more-text');
                            if (inlineText)
                                bio = ((_f = inlineText.textContent) === null || _f === void 0 ? void 0 : _f.trim()) || "";
                        }
                    }
                }
                if (!bio) {
                    const description = document.querySelector('.description');
                    if (description)
                        bio = ((_g = description.textContent) === null || _g === void 0 ? void 0 : _g.trim()) || "";
                }
                return { fullName, headline, bio };
            });
            // Update Firestore with correct field names
            const updates = {};
            if (profileData.fullName)
                updates.full_name = profileData.fullName;
            if (profileData.headline)
                updates.headline = profileData.headline;
            if (profileData.bio)
                updates.bio = profileData.bio;
            if (Object.keys(updates).length > 0) {
                await db.doc(`users/${userId}`).set(updates, { merge: true });
            }
            // Only return profile if we found at least one field to signal success to frontend
            if (profileData.fullName || profileData.headline || profileData.bio) {
                result.profile = profileData;
            }
            else {
                result.warning = "Could not extract public profile data. LinkedIn may be requiring login.";
            }
        }
        else if (mode === 'posts') {
            // Extract Recent Posts
            // Public profiles usually don't show the "Activity" feed easily without login.
            // However, sometimes "Articles" or "Posts" are visible or we can try navigating to /recent-activity/
            // Try going to activity page? Public activity pages are often strictly auth-walled.
            // We will attempt to find posts on the main profile page (if they exist in "Activity" section)
            // This is a "Best Effort" scraper.
            const posts = await page.evaluate(() => {
                const postTexts = [];
                // Selectors for public profile posts (often found in 'canvas' or 'feed' containers on public view)
                // Note: On public profiles, posts might be in sections like .core-rail or specific feed updates
                // We try multiple selectors often found in public/guest view
                // Helper to clean text
                const cleanText = (text) => text.replace(/\s+/g, ' ').trim();
                // Strategy 1: Look for specific post containers
                const descriptionElements = document.querySelectorAll('.feed-shared-update-v2__description');
                descriptionElements.forEach(el => {
                    const text = cleanText(el.textContent || '');
                    if (text.length > 50)
                        postTexts.push(text);
                });
                // Strategy 2: If none found, try broader text search in main rail
                if (postTexts.length === 0) {
                    const coreRail = document.querySelector('.core-rail');
                    if (coreRail) {
                        const paragraphs = coreRail.querySelectorAll('p, span.break-words');
                        paragraphs.forEach(p => {
                            const text = cleanText(p.textContent || '');
                            // Arbitrary length filter to avoid buttons/headers
                            if (text.length > 60 && !postTexts.includes(text)) {
                                postTexts.push(text);
                            }
                        });
                    }
                }
                // Strategy 3: Try retrieving from activity section specific to public view
                if (postTexts.length === 0) {
                    const components = document.querySelectorAll('[data-generated-suggestion-target]');
                    components.forEach(comp => {
                        const text = cleanText(comp.textContent || '');
                        if (text.length > 60)
                            postTexts.push(text);
                    });
                }
                return postTexts.slice(0, 10); // Return top 10
            });
            // Since public post scraping is hard, let's just return what we find.
            // If empty, frontend will tell user "Could not fetch posts publicy. Please copy paste."
            if (posts.length > 0) {
                // Append to saved posts
                const voiceRef = db.doc(`users/${userId}/voice_profiles/default`);
                const docSnap = await voiceRef.get();
                const currentPosts = ((_b = docSnap.data()) === null || _b === void 0 ? void 0 : _b.sample_posts) || [];
                const newPosts = [...currentPosts, ...posts].slice(-10); // Keep max 10
                await voiceRef.set({ sample_posts: newPosts }, { merge: true });
                result.postsFound = posts.length;
            }
            else {
                result.warning = "No public posts found. LinkedIn might be blocking public access. Please verify your profile public visibility or paste posts manually.";
            }
        }
        await browser.close();
        return result;
    }
    catch (error) {
        console.error("Scraper Error:", error);
        if (browser)
            await browser.close();
        throw new functions.https.HttpsError('internal', "Failed to sync linkedIn: " + error.message);
    }
};
exports.syncLinkedInProfileHandler = syncLinkedInProfileHandler;
//# sourceMappingURL=linkedin_scraper.js.map