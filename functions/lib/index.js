"use strict";
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledTopicWorker = exports.scheduledCleanup = exports.handleStripeWebhook = exports.createStripeCheckoutSession = exports.fetchTrending = exports.generateRecommendations = exports.analyzeVoice = exports.generatePost = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const generative_ai_1 = require("@google/generative-ai");
admin.initializeApp();
const db = admin.firestore();
const puppeteer = require("puppeteer-core");
const chromium = require('@sparticuz/chromium');
const stripe_1 = require("stripe");
const STRIPE_SECRET_KEY = (_a = functions.config().stripe) === null || _a === void 0 ? void 0 : _a.secret_key;
const WEBHOOK_SECRET = (_b = functions.config().stripe) === null || _b === void 0 ? void 0 : _b.webhook_secret;
const STRIPE_PRICE_ID = (_c = functions.config().stripe) === null || _c === void 0 ? void 0 : _c.price_id;
// Initialize Stripe (lazy init inside functions recommended usually, but global is fine for cold starts)
const stripe = new stripe_1.default(STRIPE_SECRET_KEY || 'dummy_key', {
    apiVersion: '2022-11-15', // Suppress strict version check
});
// Ensure you set this config: firebase functions:config:set google.api_key="YOUR_KEY"
// Or use process.env.GEMINI_API_KEY if using dotenv
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ((_d = functions.config().google) === null || _d === void 0 ? void 0 : _d.api_key);
// Initialize conditionally or handle errors during generation
const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY || "dummy_key");
// Using 2.0 Flash as 1.5 is unavailable for this project
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
const cors = require('cors')({ origin: true });
exports.generatePost = functions.https.onRequest((req, res) => {
    console.log("generatePost invoked", {
        method: req.method,
        auth: !!req.headers.authorization,
        bodyKeys: Object.keys(req.body || {})
    });
    cors(req, res, async () => {
        var _a;
        try {
            // Manual Auth Verification
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            // Check API Key
            if (!GEMINI_API_KEY || GEMINI_API_KEY === "dummy_key") {
                console.error("GEMINI_API_KEY is not configured.");
                res.status(500).json({ error: "Server configuration error: Gemini API Key is missing. Please contact support or run 'firebase functions:config:set google.api_key=\"YOUR_KEY\"'" });
                return;
            }
            const idToken = authHeader.split('Bearer ')[1];
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(idToken);
            }
            catch (e) {
                res.status(401).json({ error: "Invalid token" });
                return;
            }
            const userId = decodedToken.uid;
            const { prompt, type, tone, sourceUrl: _sourceUrl, voiceTranscript: _voiceTranscript, editorContent, changeRequest, templatePrompt, templateId } = req.body.data || req.body; // Handle both direct JSON and callable format
            // ... Existing Logic ...
            // 1. Fetch Voice Profile
            let voiceContext = "";
            let systemPromptOverride = "";
            if (userId) {
                const voiceDoc = await db.doc(`users/${userId}/voice_profiles/default`).get();
                const voiceProfile = voiceDoc.data();
                if (voiceProfile === null || voiceProfile === void 0 ? void 0 : voiceProfile.is_trained) {
                    if (voiceProfile.system_prompt) {
                        systemPromptOverride = voiceProfile.system_prompt;
                    }
                    if (voiceProfile.analysis_summary) {
                        voiceContext = `
IMPORTANT - Match the user's writing style:
${voiceProfile.analysis_summary}

Tone: ${voiceProfile.tone || "professional"}
Writing style: ${voiceProfile.writing_style || "informative"}
Emoji usage: ${voiceProfile.emoji_usage || "moderate"}
Sentence length: ${voiceProfile.sentence_length || "medium"}
`;
                    }
                }
            }
            // 2. Tone Instructions
            const toneInstructions = {
                professional: "Write in a polished, business-appropriate tone. Be authoritative but approachable.",
                witty: "Add clever observations and subtle humor. Be engaging and entertaining while staying professional.",
                inspiring: "Be motivational and uplifting. Share insights that inspire action and positive change.",
                casual: "Write in a friendly, conversational tone. Be relatable and approachable like talking to a friend.",
                educational: "Focus on teaching and sharing knowledge. Use clear explanations and practical examples.",
            };
            const toneOverlay = tone && toneInstructions[tone] ? `\n\nTone overlay: ${toneInstructions[tone]}` : "";
            // 3. System Prompt
            const baseSystemPrompt = `You are an expert LinkedIn content creator. Generate engaging, authentic LinkedIn posts that drive engagement.

Guidelines:
- Write in first person
- Use line breaks for readability (LinkedIn style)
- Include a hook in the first line
- Add relevant emojis sparingly
- End with a call-to-action or thought-provoking question
- Keep posts between 150-300 words for optimal engagement
- DO NOT include hashtags at the end
- Make it feel personal and authentic, not corporate
- IMPORTANT: Return ONLY the post content. Do not output any conversational filler or introductory text like "Here is a draft".
${voiceContext}${toneOverlay}`;
            const systemPrompt = systemPromptOverride || baseSystemPrompt;
            // 4. User Prompt Construction
            let userPrompt = "";
            if (editorContent && changeRequest) {
                userPrompt = `Here is the current LinkedIn post:\n\n---\n${editorContent}\n---\n\n`;
                userPrompt += `The user wants to make the following changes: "${changeRequest}"\n\n`;
                if (templatePrompt) {
                    userPrompt += `Additionally, apply this template format:\n${templatePrompt}\n\n`;
                }
                userPrompt += `Please regenerate the post incorporating the requested changes while maintaining the core message. Apply the tone specified in the system prompt.`;
            }
            else {
                switch (type) {
                    case "topic":
                    case "idea":
                        userPrompt = `Write a LinkedIn post based on the following:\n\n${prompt}`;
                        break;
                    case "url":
                        userPrompt = `Write a LinkedIn post sharing insights or commentary about this content. Summarize the key points and add your personal take:\n\n${prompt}`;
                        break;
                    case "notes":
                    case "voice":
                        userPrompt = `Transform these rough thoughts/notes into a polished, engaging LinkedIn post. Keep the core message but make it engaging:\n\n${prompt}`;
                        break;
                    case "repurpose":
                        userPrompt = `Repurpose this document content into a compelling LinkedIn post. Extract the key insights and present them in an engaging way:\n\n${prompt}`;
                        break;
                    default:
                        userPrompt = prompt;
                }
            }
            // 4.5 Increment Template Usage
            if (templateId) {
                try {
                    await db.collection('templates').doc(templateId).update({
                        usage_count: admin.firestore.FieldValue.increment(1)
                    });
                }
                catch (err) {
                    console.error("Error incrementing template usage:", err);
                    // Continue even if this fails
                }
            }
            // 5. Call AI
            const result = await model.generateContent({
                contents: [
                    { role: "user", parts: [{ text: systemPrompt + "\n\nTask:\n" + userPrompt }] }
                ]
            });
            const response = await result.response;
            const generatedContent = response.text();
            if (!generatedContent) {
                res.status(500).json({ error: "No content generated" });
                return;
            }
            // Return matching callable format: { data: { content: ... } }
            // Or just direct JSON if using fetch. Let's use direct JSON for simplicity.
            res.json({ content: generatedContent });
        }
        catch (error) {
            console.error("Error generating post:", error);
            if (((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('429')) || error.status === 429) {
                res.status(429).json({
                    error: "Quota exceeded. Please ensure your Google Cloud Project has Billing enabled and you have valid quota for Gemini API."
                });
                return;
            }
            res.status(500).json({ error: error.message });
        }
    });
});
exports.analyzeVoice = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    const { posts, userId } = data;
    try {
        const analysisPrompt = `Analyze the following LinkedIn posts and extract the writer's unique voice characteristics. Be specific and actionable.
Posts to analyze:
${posts.join("\n\n---\n\n")}

Provide analysis in exactly this JSON format:
{
  "tone": "describe the overall tone",
  "writing_style": "describe the writing style",
  "emoji_usage": "none/minimal/moderate/frequent",
  "sentence_length": "short/medium/long/varied",
  "formatting_patterns": ["list specific patterns"],
  "analysis_summary": "A 2-3 sentence summary that could be used as instructions for an AI to mimic this writing style"
}`;
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: "You are an expert writing analyst. Always respond with valid JSON only, no markdown formatting.\n\n" + analysisPrompt }] }]
        });
        const response = await result.response;
        let analysisText = response.text();
        // Clean markdown
        analysisText = analysisText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        let analysis;
        try {
            analysis = JSON.parse(analysisText);
        }
        catch (e) {
            console.error("Failed to parse JSON", analysisText);
            throw new Error("Invalid analysis format from AI");
        }
        // Update / Created voice profile
        await db.doc(`users/${userId}/voice_profiles/default`).set(Object.assign(Object.assign({}, analysis), { sample_posts: posts, is_trained: true, trained_at: new Date().toISOString(), user_id: userId, updated_at: new Date().toISOString() }), { merge: true });
        return { success: true, analysis };
    }
    catch (error) {
        console.error("Error analyzing voice:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
exports.generateRecommendations = functions.runWith({
    timeoutSeconds: 300,
    memory: "1GB"
}).https.onRequest((req, res) => {
    cors(req, res, async () => {
        try {
            // Manual Auth Verification
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                res.status(401).json({ error: "Unauthorized" });
                return;
            }
            const idToken = authHeader.split('Bearer ')[1];
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(idToken);
            }
            catch (e) {
                res.status(401).json({ error: "Invalid token" });
                return;
            }
            // Extract data from body
            const { userId, topics, forceRefresh } = req.body;
            // Check subscription tier (mock check or from token claims if custom claims set)
            // For now, we assume forceRefresh is only true if frontend allows it (paid users)
            console.log("generateRecommendations invoked", {
                uid: decodedToken.uid,
                topicsCount: topics === null || topics === void 0 ? void 0 : topics.length,
                forceRefresh
            });
            if (!GEMINI_API_KEY || GEMINI_API_KEY === "dummy_key") {
                console.error("GEMINI_API_KEY is missing or invalid");
                res.status(412).json({ error: "AI configuration error: API Key missing" });
                return;
            }
            const recommendations = [];
            const freshThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
            for (const topic of topics.slice(0, 3)) { // Limit to processing 3 topics max per request
                const topicLower = topic.toLowerCase();
                // 1. Check Global Topic Cache
                let insights = [];
                if (!forceRefresh) {
                    const insightDoc = await db.collection("topic_insights").doc(topicLower).get();
                    if (insightDoc.exists) {
                        const data = insightDoc.data();
                        if (data && new Date(data.generated_at) > freshThreshold) {
                            console.log(`Cache hit for topic: ${topic}`);
                            insights = data.insights || [];
                        }
                    }
                }
                // 2. Generate if Cache Miss or Force Refresh
                if (insights.length === 0) {
                    console.log(`Cache miss for topic: ${topic}. Generating...`);
                    insights = await generateTopicInsights(topic);
                }
                // 3. Format for User
                if (insights.length > 0) {
                    insights.forEach((insight) => {
                        recommendations.push({
                            user_id: userId,
                            topic: topic,
                            title: insight.title,
                            content: insight.content,
                            source_type: insight.source_type,
                            source_url: insight.source_url || null,
                            source_title: insight.source_title || null,
                            is_used: false,
                            generated_at: new Date().toISOString(),
                            expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                            created_at: new Date().toISOString()
                        });
                    });
                }
            }
            // 4. Save to User's Recommended Posts
            if (recommendations.length > 0) {
                const batch = db.batch();
                recommendations.forEach((rec) => {
                    const docRef = db.collection("recommended_posts").doc();
                    batch.set(docRef, rec);
                });
                await batch.commit();
            }
            res.json({ success: true, recommendations });
        }
        catch (error) {
            console.error("Error generating recommendations:", error);
            res.status(500).json({ error: error.message || "Failed to generate recommendations" });
        }
    });
});
// Helper to save items to trending cache
async function cacheTrendingItems(items, type, topic) {
    if (items.length === 0)
        return;
    const batch = db.batch();
    const nowIso = new Date().toISOString();
    let batchCount = 0;
    items.forEach(item => {
        const sourceId = type === 'news' ? item.link : item.permalink;
        if (!sourceId)
            return;
        // distinct ID
        const docId = `${topic}_${Buffer.from(sourceId).toString('base64').substring(0, 50)}`.replace(/\//g, '_');
        const docRef = db.collection('trending_cache').doc(docId);
        batch.set(docRef, {
            topic: topic.toLowerCase(),
            timeframe: '7d',
            item_type: type,
            source_id: sourceId,
            title: item.title,
            description: type === 'news' ? item.description : item.selftext,
            source_name: type === 'news' ? item.source : (item.subreddit ? `r/${item.subreddit}` : 'LinkedIn'),
            source_url: type === 'news' ? item.link : item.permalink,
            category: type === 'news' ? item.category : 'social',
            published_at: type === 'news' ? item.pubDate : new Date(item.createdUtc * 1000).toISOString(),
            score: item.score || 0,
            num_comments: item.numComments || 0,
            author: item.author || "",
            fetched_at: nowIso
        });
        batchCount++;
    });
    if (batchCount > 0)
        await batch.commit();
}
// Helper function to generate insights for a SINGLE topic
async function generateTopicInsights(topic) {
    try {
        const topicLower = topic.toLowerCase();
        // 1. Fetch Trending Context
        const cacheAge = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
        let snapshot = await db.collection("trending_cache")
            .where("topic", "==", topicLower)
            .where("fetched_at", ">", cacheAge.toISOString())
            .limit(10)
            .get();
        let relevantItems = snapshot.docs.map(d => d.data());
        // 2. SCRAPE IF EMPTY (Real-time fallback)
        if (relevantItems.length < 3) {
            console.log(`Cache low for ${topic}, scraping fresh data...`);
            // Parallel fetch
            const [newsItems, linkedInItems] = await Promise.all([
                fetchGoogleNews(topic),
                fetchLinkedInPosts(topic)
            ]);
            // Cache them
            await Promise.all([
                cacheTrendingItems(newsItems.slice(0, 5), 'news', topicLower),
                cacheTrendingItems(linkedInItems.slice(0, 5), 'post', topicLower)
            ]);
            // Refresh relevant items from memory (converting to cache format)
            const newItems = [
                ...newsItems.map(item => ({
                    title: item.title, description: item.description,
                    source_name: item.source, source_url: item.link
                })),
                ...linkedInItems.map(item => ({
                    title: item.title, description: item.selftext,
                    source_name: 'LinkedIn', source_url: item.permalink
                }))
            ];
            relevantItems = [...relevantItems, ...newItems].slice(0, 10);
        }
        let trendingContext = "";
        if (relevantItems.length > 0) {
            trendingContext = "Trending now:\n" + relevantItems.map(i => { var _a; return `- ${i.title} (${(_a = i.description) === null || _a === void 0 ? void 0 : _a.substring(0, 100)}...)`; }).join("\n");
        }
        else {
            // Fallback: Just use topic name if no news found even after scraping
            trendingContext = `Topic: ${topic}`;
        }
        console.log(`Generating insights for ${topic} with ${relevantItems.length} context items.`);
        const prompt = `Based on the following trending content for the topic "${topic}", generate 3 unique, engaging LinkedIn post concepts.
        FOR EACH CONCEPT, provide:
        - A short catchy title
        - The hook/concept description
        - The source title/url if it's based on a specific trending item from the list.

${trendingContext}

Respond with valid JSON only:
{
  "insights": [
    {
      "title": "string",
      "content": "string",
      "source_type": "trending", 
      "source_title": "string (optional)",
      "source_url": "string (optional)"
    }
  ]
}`;
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const json = JSON.parse(text);
        const insights = json.insights || [];
        // Save to Global Cache
        if (insights.length > 0) {
            await db.collection("topic_insights").doc(topic.toLowerCase()).set({
                topic: topic.toLowerCase(),
                insights: insights,
                generated_at: new Date().toISOString(),
                // Add expires_at for TTL (90 days as per user retention, or keep short for freshness?)
                // Actually topic insights should be fresh. Let's keep them for 7 days in cache.
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        return insights;
    }
    catch (e) {
        console.error(`Failed to generate insights for topic ${topic}`, e);
        return [];
    }
}
// RSS Feed sources
// Google News RSS
// Google News RSS: generic fetcher
async function fetchRSS(query, sourceName, category) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
        return await parseRSSFeed(url, sourceName, category);
    }
    catch (error) {
        console.error(`Error fetching RSS for ${query}:`, error);
        return [];
    }
}
async function fetchGoogleNews(topic) {
    return fetchRSS(topic, "Google News", "news");
}
async function fetchLinkedInPosts(topic) {
    // Search for "site:linkedin.com/posts TOPIC"
    const results = await fetchRSS(`site:linkedin.com/posts ${topic}`, "LinkedIn", "social");
    // Post-process to make them look more like social posts
    return results.map(item => ({
        title: item.title.replace(" - LinkedIn", ""),
        url: item.link,
        subreddit: "LinkedIn",
        score: 0,
        numComments: 0,
        author: "LinkedIn User",
        createdUtc: new Date(item.pubDate).getTime() / 1000,
        selftext: item.description,
        permalink: item.link
    }));
}
async function enrichLinkedInPost(post) {
    // Only enrich if we have a valid link and it's a LinkedIn post
    if (!post.url || !post.url.includes("google.com/rss"))
        return post;
    console.log(`Enriching LinkedIn post: ${post.title.substring(0, 30)}...`);
    let browser = null;
    try {
        // Configure Chromium for Cloud Functions
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
        const page = await browser.newPage();
        // Block resources to speed up
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            }
            else {
                req.continue();
            }
        });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        // Navigate
        await page.goto(post.url, { waitUntil: 'domcontentloaded', timeout: 25000 }); // Slower forredirects
        // Wait for redirect logic
        try {
            await page.waitForNavigation({ timeout: 5000 }).catch(() => { });
        }
        catch (e) { }
        const currentUrl = page.url();
        if (!currentUrl.includes("linkedin.com")) {
            console.log("Failed to resolve LinkedIn URL via Puppeteer");
            return post;
        }
        // Extract using JSON-LD method which proved most robust
        let reactions = 0;
        let comments = 0;
        try {
            // Check for JSON-LD
            // @ts-ignore
            const jsonLds = await page.$$eval('script[type="application/ld+json"]', (scripts) => scripts.map((s) => JSON.parse(s.innerText)));
            jsonLds.forEach((data) => {
                if (data.interactionStatistic) {
                    data.interactionStatistic.forEach((stat) => {
                        var _a, _b;
                        if ((_a = stat.interactionType) === null || _a === void 0 ? void 0 : _a.includes("LikeAction")) {
                            reactions = Number(stat.userInteractionCount) || 0;
                        }
                        if ((_b = stat.interactionType) === null || _b === void 0 ? void 0 : _b.includes("CommentAction")) {
                            comments = Number(stat.userInteractionCount) || 0;
                        }
                    });
                }
            });
        }
        catch (e) {
            console.error("Error parsing JSON-LD in enrichment:", e);
        }
        // Fallback to title check if JSON-LD fails (as seen in script output)
        if (reactions === 0 && comments === 0) {
            // Title often has " | Name | X comments"
            // No likes in title usually.
        }
        console.log(`Enriched: ${reactions} likes, ${comments} comments`);
        return Object.assign(Object.assign({}, post), { score: reactions, numComments: comments });
    }
    catch (error) {
        console.error("Enrichment failed:", error);
        return post;
    }
    finally {
        if (browser)
            await browser.close();
    }
}
function getTimeframeCutoff(timeframe) {
    const now = new Date();
    switch (timeframe) {
        case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case "7d":
        default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
}
function getCacheFreshness(timeframe) {
    switch (timeframe) {
        case "24h": return 60 * 60 * 1000;
        case "30d": return 24 * 60 * 60 * 1000;
        case "7d":
        default: return 6 * 60 * 60 * 1000;
    }
}
async function parseRSSFeed(feedUrl, source, category) {
    var _a, _b, _c, _d;
    try {
        const response = await fetch(feedUrl, { headers: { "User-Agent": "TrendingBot/1.0" } });
        if (!response.ok)
            return [];
        const text = await response.text();
        const items = [];
        const itemMatches = text.match(/<item>[\s\S]*?<\/item>/g) || [];
        for (const itemXml of itemMatches.slice(0, 15)) {
            const title = ((_a = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)) === null || _a === void 0 ? void 0 : _a[1]) || "";
            const link = ((_b = itemXml.match(/<link>(.*?)<\/link>/)) === null || _b === void 0 ? void 0 : _b[1]) || "";
            const description = ((_c = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)) === null || _c === void 0 ? void 0 : _c[1]) || "";
            const pubDate = ((_d = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)) === null || _d === void 0 ? void 0 : _d[1]) || "";
            if (title && link) {
                items.push({
                    title: title.replace(/<[^>]*>/g, "").trim(),
                    link: link.trim(),
                    description: description
                        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
                        .replace(/<[^>]*>/g, "")
                        .substring(0, 200).trim(),
                    pubDate,
                    source,
                    category,
                });
            }
        }
        return items;
    }
    catch (error) {
        console.error(`Error parsing ${source}:`, error);
        return [];
    }
}
async function fetchRedditPosts(topics, timeframe) {
    var _a;
    const posts = [];
    const cutoff = getTimeframeCutoff(timeframe);
    const redditTimeFilter = timeframe === "24h" ? "day" : timeframe === "30d" ? "month" : "week";
    // Helper to fetch default if needed
    const fetchDefaults = async () => {
        var _a;
        console.log("Fetching default subreddits...");
        const subreddits = ["Entrepreneur", "startups", "technology", "business", "productivity"];
        for (const subreddit of subreddits) {
            try {
                const response = await fetch(`https://www.reddit.com/r/${subreddit}/top.json?t=${redditTimeFilter}&limit=10`, { headers: { "User-Agent": "AuthraxBot/1.0" } });
                if (!response.ok) {
                    console.warn(`Failed to fetch r/${subreddit}: ${response.status}`);
                    continue;
                }
                const data = await response.json();
                const children = ((_a = data === null || data === void 0 ? void 0 : data.data) === null || _a === void 0 ? void 0 : _a.children) || [];
                for (const child of children) {
                    const post = child.data;
                    if (post.stickied || post.over_18)
                        continue;
                    // For defaults, be strict about 24h cutoff
                    if (new Date(post.created_utc * 1000) < cutoff)
                        continue;
                    posts.push(formatRedditPost(post));
                }
            }
            catch (e) {
                console.error(`Error fetching r/${subreddit}`, e);
            }
        }
    };
    const formatRedditPost = (post) => {
        var _a;
        return ({
            title: post.title,
            url: post.url,
            subreddit: post.subreddit,
            score: post.score,
            numComments: post.num_comments,
            author: post.author,
            createdUtc: post.created_utc,
            selftext: ((_a = post.selftext) === null || _a === void 0 ? void 0 : _a.substring(0, 300)) || "",
            permalink: `https://reddit.com${post.permalink}`,
        });
    };
    // If no topics, use default subreddits
    if (topics.length === 0) {
        await fetchDefaults();
    }
    else {
        // If topics exist, SEARCH for them
        for (const topic of topics.slice(0, 5)) {
            try {
                const encodedTopic = encodeURIComponent(topic);
                const response = await fetch(`https://www.reddit.com/search.json?q=${encodedTopic}&sort=top&t=${redditTimeFilter}&limit=10`, { headers: { "User-Agent": "AuthraxBot/1.0" } });
                if (!response.ok) {
                    console.warn(`Failed to fetch topic '${topic}': ${response.status}`);
                    continue;
                }
                const data = await response.json();
                const children = ((_a = data === null || data === void 0 ? void 0 : data.data) === null || _a === void 0 ? void 0 : _a.children) || [];
                for (const child of children) {
                    const post = child.data;
                    if (post.stickied || post.over_18)
                        continue;
                    const postDate = new Date(post.created_utc * 1000);
                    if (postDate < cutoff)
                        continue;
                    posts.push(formatRedditPost(post));
                }
            }
            catch (error) {
                console.error(`Error searching Reddit for ${topic}:`, error);
            }
        }
        // FALLBACK: If search yielded no results, fetch defaults
        if (posts.length === 0) {
            console.log("No specific topic posts found, falling back to defaults.");
            await fetchDefaults();
        }
    }
    // De-duplicate by permalink
    const seen = new Set();
    const uniquePosts = posts.filter(p => {
        if (seen.has(p.permalink))
            return false;
        seen.add(p.permalink);
        return true;
    });
    return uniquePosts.sort((a, b) => b.score - a.score).slice(0, 25);
}
exports.fetchTrending = functions
    .runWith({
    timeoutSeconds: 300,
    memory: "2GB",
})
    .https.onCall(async (data, context) => {
    // If not authenticated, you might want to allow public access or strict auth?
    // Supabase version only checked headers. We'll allow open for now or check auth.
    // if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required");
    const { topics = [], page = 1, type = "all", timeframe = "7d", forceRefresh = false } = data;
    const cacheFreshness = getCacheFreshness(timeframe);
    // Check Cache
    let cachedNews = [];
    let cachedPosts = [];
    let useCache = false;
    if (topics.length > 0 && !forceRefresh) {
        // Simple cache check - querying Firestore
        // Note: Complicated queries might need composite indexes
        // We will try fetching by topic and filtering in code for freshness if needed or query
        const cacheAge = new Date(Date.now() - cacheFreshness);
        for (const topic of topics) {
            const topicLower = topic.toLowerCase();
            // Simplify query to avoid composite index requirement
            const snap = await db.collection('trending_cache')
                .where('topic', '==', topicLower)
                .limit(50) // Fetch more to filter in memory
                .get();
            if (!snap.empty) {
                snap.forEach(doc => {
                    var _a;
                    const item = doc.data();
                    // Check freshness and timeframe in memory
                    const itemDate = new Date(item.fetched_at);
                    if (itemDate > cacheAge && item.timeframe === timeframe) {
                        useCache = true;
                        if (item.item_type === 'news') {
                            cachedNews.push({
                                title: item.title,
                                link: item.source_url,
                                description: item.description,
                                pubDate: item.published_at,
                                source: item.source_name,
                                category: item.category
                            });
                        }
                        else if (item.item_type === 'post') {
                            cachedPosts.push({
                                title: item.title,
                                url: item.source_url,
                                subreddit: (_a = item.source_name) === null || _a === void 0 ? void 0 : _a.replace('r/', ''),
                                score: item.score,
                                numComments: item.num_comments,
                                author: item.author,
                                createdUtc: new Date(item.published_at).getTime() / 1000,
                                selftext: item.description,
                                permalink: item.source_url
                            });
                        }
                    }
                });
            }
        }
    }
    if (useCache && (cachedNews.length > 0 || cachedPosts.length > 0)) {
        // Return cached
        // Sort and paginate
        // ... (simplified for brevity)
    }
    // If cache not sufficient, fetch fresh (omitted heavy logic to save tokens, but effectively same as above `fetchRedditPosts` and `parseRSSFeed` calls)
    // To complete the implementation:
    let news = [];
    let posts = [];
    if (!useCache) {
        if (type === "all" || type === "news") {
            if (topics.length > 0) {
                // Fetch Google News for each topic
                const newsPromises = topics.slice(0, 5).map(topic => fetchGoogleNews(topic));
                const newsResults = await Promise.all(newsPromises);
                news = newsResults.flat();
            }
            else {
                // Default general news if no topics (fallback to technology/business)
                const defaultTopics = ["Startup", "Technology", "Business"];
                const newsPromises = defaultTopics.map(topic => fetchGoogleNews(topic));
                const newsResults = await Promise.all(newsPromises);
                news = newsResults.flat();
            }
            // Deduplicate news
            const seenLinks = new Set();
            news = news.filter(n => {
                if (seenLinks.has(n.link))
                    return false;
                seenLinks.add(n.link);
                return true;
            });
            // Sort by date desc
            news.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        }
        if (type === "all" || type === "posts") {
            // Fetch LinkedIn Posts (Primary)
            let linkedInPosts = [];
            if (topics.length > 0) {
                // Limit to top 3 topics to avoid excessive requests
                const linkedInPromises = topics.slice(0, 3).map(topic => fetchLinkedInPosts(topic));
                const linkedInResults = await Promise.all(linkedInPromises);
                // Filter LinkedIn posts by timeframe
                const cutoff = getTimeframeCutoff(timeframe);
                linkedInPosts = linkedInResults.flat().filter(post => {
                    const postDate = new Date(post.createdUtc * 1000);
                    return postDate >= cutoff;
                });
                // ENRICHMENT: Fetch reactions for top 5 LinkedIn posts
                // We limit to 5 to avoid timeout (each takes ~5-10s)
                if (linkedInPosts.length > 0) {
                    console.log(`Enriching ${Math.min(linkedInPosts.length, 5)} LinkedIn posts...`);
                    const enrichmentPromises = linkedInPosts.slice(0, 5).map(post => enrichLinkedInPost(post));
                    const enrichedTop = await Promise.all(enrichmentPromises);
                    // Merge back
                    linkedInPosts = [...enrichedTop, ...linkedInPosts.slice(5)];
                }
            }
            // Fetch Reddit Posts (Secondary / Fallback)
            const redditPosts = await fetchRedditPosts(topics, timeframe);
            // Combine: LinkedIn first, then Reddit
            posts = [...linkedInPosts, ...redditPosts];
        }
        // Cache results
        const batch = db.batch();
        const nowIso = new Date().toISOString();
        let batchCount = 0;
        const cacheItem = (item, type, topic) => {
            const sourceId = type === 'news' ? item.link : item.permalink;
            // distinct ID
            const docId = `${topic}_${timeframe}_${Buffer.from(sourceId).toString('base64').substring(0, 100)}`.replace(/\//g, '_');
            const docRef = db.collection('trending_cache').doc(docId);
            batch.set(docRef, {
                topic,
                timeframe,
                item_type: type,
                source_id: sourceId,
                title: item.title,
                description: type === 'news' ? item.description : item.selftext,
                source_name: type === 'news' ? item.source : `r/${item.subreddit}`,
                source_url: type === 'news' ? item.link : item.permalink,
                category: type === 'news' ? item.category : 'social',
                published_at: type === 'news' ? item.pubDate : new Date(item.createdUtc * 1000).toISOString(),
                score: item.score || 0,
                num_comments: item.numComments || 0,
                author: item.author || "",
                fetched_at: nowIso
            });
            batchCount++;
        };
        // If we have topics, cache items under those topics
        if (topics.length > 0) {
            topics.forEach((topic) => {
                news.slice(0, 5).forEach(n => cacheItem(n, 'news', topic.toLowerCase()));
                posts.slice(0, 5).forEach(p => cacheItem(p, 'post', topic.toLowerCase()));
            });
        }
        if (batchCount > 0)
            await batch.commit();
        cachedNews = news;
        cachedPosts = posts;
    }
    // Pagination
    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const slicedNews = cachedNews.slice(startIndex, startIndex + pageSize);
    const slicedPosts = cachedPosts.slice(startIndex, startIndex + pageSize);
    return {
        news: slicedNews,
        posts: slicedPosts,
        hasMoreNews: cachedNews.length > startIndex + pageSize,
        hasMorePosts: cachedPosts.length > startIndex + pageSize,
        totalNews: cachedNews.length,
        totalPosts: cachedPosts.length,
        cached: useCache
    };
});
// Stripe Integration
exports.createStripeCheckoutSession = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "Auth required");
    if (!STRIPE_SECRET_KEY || STRIPE_SECRET_KEY === 'dummy_key') {
        throw new functions.https.HttpsError("failed-precondition", "Stripe not configured (missing secret_key)");
    }
    if (!STRIPE_PRICE_ID) {
        throw new functions.https.HttpsError("failed-precondition", "Stripe not configured (missing price_id)");
    }
    // const { plan } = data; 
    // In future, map plan to priceId. For now, assume single pro plan.
    const priceId = STRIPE_PRICE_ID;
    const userId = context.auth.uid;
    const userEmail = context.auth.token.email;
    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            customer_email: userEmail,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            // Success/Cancel URLs
            success_url: `${data.origin || 'http://localhost:5173'}/?payment=success`,
            cancel_url: `${data.origin || 'http://localhost:5173'}/?payment=cancelled`,
            metadata: {
                userId: userId
            }
        });
        return { url: session.url };
    }
    catch (error) {
        console.error("Stripe Checkout Error:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
exports.handleStripeWebhook = functions.https.onRequest(async (req, res) => {
    var _a;
    const signature = req.headers['stripe-signature'];
    if (!WEBHOOK_SECRET) {
        console.error("Stripe Webhook Secret missing");
        res.status(500).send("Configuration Error");
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, signature, WEBHOOK_SECRET);
    }
    catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    console.log("Stripe Event Type:", event.type);
    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.userId;
            const customerId = session.customer;
            if (userId) {
                console.log(`Upgrading user ${userId} to Pro`);
                await db.doc(`profiles/${userId}`).set({
                    subscription_tier: 'pro',
                    stripe_customer_id: customerId,
                    subscription_status: 'active',
                    subscription_updated_at: new Date().toISOString()
                }, { merge: true });
            }
            else {
                console.warn("No userId in session metadata");
            }
        }
        else if (event.type === 'customer.subscription.deleted') {
            // Handle cancellations
            const subscription = event.data.object;
            const customerId = subscription.customer;
            // Find user by customer ID
            const snapshot = await db.collection('profiles').where('stripe_customer_id', '==', customerId).get();
            if (!snapshot.empty) {
                snapshot.forEach(async (doc) => {
                    await doc.ref.update({
                        subscription_tier: 'free',
                        subscription_status: 'canceled',
                        subscription_updated_at: new Date().toISOString()
                    });
                });
            }
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error("Error processing webhook:", error);
        res.status(500).send("Processing Error");
    }
});
exports.scheduledCleanup = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    console.log(`Starting cleanup of recommended_posts older than ${cutoffDate.toISOString()}`);
    // Process in batches
    const batchSize = 400;
    const snapshot = await db.collection('recommended_posts')
        .where('created_at', '<', cutoffDate.toISOString())
        .limit(batchSize)
        .get();
    if (snapshot.empty) {
        console.log("No old recommendations to clean up.");
        return null;
    }
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`Deleted ${snapshot.size} expired recommendations.`);
    return null;
});
exports.scheduledTopicWorker = functions.runWith({
    timeoutSeconds: 540,
    memory: "2GB"
}).pubsub.schedule('every 12 hours').onRun(async (context) => {
    console.log("Starting Scheduled Topic Worker...");
    try {
        // 1. Identify Top 50 Active Topics
        // In a real app at scale, you'd use a sharded counter or aggregation.
        // For now, we'll scan all user topics (not scalable for >10k users but fine for now)
        // OR rely on a 'stats' collection maintained by triggers.
        // Let's implement a simple aggregation here since we don't have stats yet.
        // This is expensive: O(Users). Better to have 'stats/global_topics' { name: 'ai', count: 100 }
        // For this implementation step, let's assume we scan a 'topic_subscriptions' global collection OR just scan users.
        // To be safe and fast: Let's fetch the 50 most recently updated user topics as a proxy for activity
        // Or better: Let's just create a 'global_topics' collection and query that if it existed.
        // Pivot: Since we don't have global stats, let's just use the `topic_insights` existing keys as seed + query users.
        // Simple approach: Get ALL recommended_posts from last 24h, group by topic, take top 50.
        // This tells us what people are actively receiving.
        const recentRecs = await db.collection("recommended_posts")
            .orderBy("created_at", "desc")
            .limit(1000)
            .get();
        const topicCounts = {};
        recentRecs.docs.forEach(doc => {
            const t = doc.data().topic;
            if (t)
                topicCounts[t] = (topicCounts[t] || 0) + 1;
        });
        const topTopics = Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50)
            .map(e => e[0]);
        console.log(`Identified ${topTopics.length} active topics to refresh:`, topTopics);
        // 2. Refresh Insights for each (Delta Check)
        const freshThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days matching the main function
        for (const topic of topTopics) {
            // Check if we already have fresh insights
            const docSnap = await db.collection("topic_insights").doc(topic.toLowerCase()).get();
            if (docSnap.exists) {
                const data = docSnap.data();
                if (data && new Date(data.generated_at) > freshThreshold) {
                    console.log(`Worker: Skipping fresh topic ${topic}`);
                    continue;
                }
            }
            console.log(`Worker refreshing topic: ${topic}`);
            await generateTopicInsights(topic);
            // Sleep briefly to avoid rate limits if needed
            await new Promise(r => setTimeout(r, 1000));
        }
        console.log("Topic Worker Finished.");
        return null;
    }
    catch (e) {
        console.error("Topic Worker Failed", e);
        return null;
    }
});
//# sourceMappingURL=index.js.map