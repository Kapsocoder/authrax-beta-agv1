"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledTopicWorker = exports.scheduledCleanup = exports.fetchTrending = exports.generateRecommendations = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const axios_1 = __importDefault(require("axios"));
const firebase_1 = require("./firebase");
const genAI = new generative_ai_1.GoogleGenerativeAI(firebase_1.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
// --- Helper Functions ---
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
        const response = await axios_1.default.get(feedUrl, {
            headers: { "User-Agent": "TrendingBot/1.0" },
            timeout: 10000
        });
        if (response.status !== 200)
            return [];
        const text = response.data;
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
    const results = await fetchRSS(`site:linkedin.com/posts ${topic}`, "LinkedIn", "social");
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
async function fetchRedditPosts(topics, timeframe) {
    var _a;
    const posts = [];
    const cutoff = getTimeframeCutoff(timeframe);
    const redditTimeFilter = timeframe === "24h" ? "day" : timeframe === "30d" ? "month" : "week";
    const fetchDefaults = async () => {
        var _a;
        const subreddits = ["Entrepreneur", "startups", "technology", "business", "productivity"];
        for (const subreddit of subreddits) {
            try {
                const response = await axios_1.default.get(`https://www.reddit.com/r/${subreddit}/top.json?t=${redditTimeFilter}&limit=10`, {
                    headers: { "User-Agent": "AuthraxBot/1.0" },
                    timeout: 10000
                });
                if (response.status !== 200)
                    continue;
                const data = response.data;
                const children = ((_a = data === null || data === void 0 ? void 0 : data.data) === null || _a === void 0 ? void 0 : _a.children) || [];
                for (const child of children) {
                    const post = child.data;
                    if (post.stickied || post.over_18)
                        continue;
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
    if (topics.length === 0) {
        await fetchDefaults();
    }
    else {
        for (const topic of topics.slice(0, 5)) {
            try {
                const encodedTopic = encodeURIComponent(topic);
                const response = await fetch(`https://www.reddit.com/search.json?q=${encodedTopic}&sort=top&t=${redditTimeFilter}&limit=10`, { headers: { "User-Agent": "AuthraxBot/1.0" } });
                if (!response.ok)
                    continue;
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
        if (posts.length === 0) {
            await fetchDefaults();
        }
    }
    const seen = new Set();
    return posts.filter(p => {
        if (seen.has(p.permalink))
            return false;
        seen.add(p.permalink);
        return true;
    }).sort((a, b) => b.score - a.score).slice(0, 25);
}
async function enrichLinkedInPost(post) {
    return post;
}
async function cacheTrendingItems(items, type, topic) {
    if (items.length === 0)
        return;
    const batch = firebase_1.db.batch();
    const nowIso = new Date().toISOString();
    let batchCount = 0;
    items.forEach(item => {
        const sourceId = type === 'news' ? item.link : item.permalink;
        if (!sourceId)
            return;
        const docId = `${topic}_${Buffer.from(sourceId).toString('base64').substring(0, 50)}`.replace(/\//g, '_');
        const docRef = firebase_1.db.collection('trending_cache').doc(docId);
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
async function generateTopicInsights(topic) {
    try {
        const topicLower = topic.toLowerCase();
        const cacheAge = new Date(Date.now() - 24 * 60 * 60 * 1000);
        let snapshot = await firebase_1.db.collection("trending_cache")
            .where("topic", "==", topicLower)
            .limit(100)
            .get();
        let relevantItems = snapshot.docs
            .map(d => d.data())
            .filter(d => d.fetched_at && new Date(d.fetched_at) > cacheAge);
        relevantItems.sort((a, b) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime());
        relevantItems = relevantItems.slice(0, 10);
        if (relevantItems.length < 3) {
            console.log(`Cache low for ${topic}, scraping fresh data...`);
            const [newsItems, linkedInItems] = await Promise.all([
                fetchGoogleNews(topic),
                fetchLinkedInPosts(topic)
            ]);
            await Promise.all([
                cacheTrendingItems(newsItems.slice(0, 5), 'news', topicLower),
                cacheTrendingItems(linkedInItems.slice(0, 5), 'post', topicLower)
            ]);
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
            trendingContext = `Topic: ${topic}`;
        }
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
        if (insights.length > 0) {
            await firebase_1.db.collection("topic_insights").doc(topic.toLowerCase()).set({
                topic: topic.toLowerCase(),
                insights: insights,
                generated_at: new Date().toISOString(),
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
// --- Exported Functions ---
exports.generateRecommendations = functions.runWith({
    timeoutSeconds: 300,
    memory: "1GB"
}).https.onRequest((req, res) => {
    // Note: onRequest handles CORS manually usually, using the 'cors' middleware or headers.
    // In original code it used `cors(req, res, async () => { ... })`
    // We will assume simpler handling or wrapper for now, but strictly we should use 'cors' lib if it's an HTTP function.
    // Original used: 
    // const cors = require('cors')({ origin: true });
    // cors(req, res, async () => { ... })
    // We should import cors.
    const cors = require('cors')({ origin: true });
    cors(req, res, async () => {
        try {
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
            const { userId, topics, forceRefresh } = req.body;
            const userDocRel = await firebase_1.db.doc(`users/${decodedToken.uid}`).get();
            const userDataRel = userDocRel.data();
            const isPro = (userDataRel === null || userDataRel === void 0 ? void 0 : userDataRel.subscription_tier) === 'pro';
            const effectiveForceRefresh = isPro ? forceRefresh : false;
            let effectiveTopics = topics;
            if (!isPro && topics.length > 3) {
                effectiveTopics = topics.slice(0, 3);
            }
            if (!firebase_1.GEMINI_API_KEY || firebase_1.GEMINI_API_KEY === "dummy_key") {
                console.error("GEMINI_API_KEY is missing or invalid");
                res.status(412).json({ error: "AI configuration error: API Key missing" });
                return;
            }
            const recommendations = [];
            const freshThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            for (const topic of effectiveTopics) {
                const topicLower = topic.toLowerCase();
                let insights = [];
                if (!effectiveForceRefresh) {
                    const insightDoc = await firebase_1.db.collection("topic_insights").doc(topicLower).get();
                    if (insightDoc.exists) {
                        const data = insightDoc.data();
                        if (data && new Date(data.generated_at) > freshThreshold) {
                            insights = data.insights || [];
                        }
                    }
                }
                if (insights.length === 0) {
                    insights = await generateTopicInsights(topic);
                }
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
            if (recommendations.length > 0) {
                const batch = firebase_1.db.batch();
                recommendations.forEach((rec) => {
                    const docRef = firebase_1.db.collection("recommended_posts").doc();
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
exports.fetchTrending = functions.runWith({
    timeoutSeconds: 300,
    memory: "2GB",
}).https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError("unauthenticated", "Auth required");
    const { topics = [], page = 1, type = "all", timeframe = "7d", forceRefresh = false } = data;
    const userId = context.auth.uid;
    const userDoc = await firebase_1.db.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    const isPro = (userData === null || userData === void 0 ? void 0 : userData.subscription_tier) === 'pro';
    const adminOverrides = (userData === null || userData === void 0 ? void 0 : userData.admin_overrides) || {};
    const bypassLimits = adminOverrides.bypass_limits === true;
    if (!isPro && !bypassLimits) {
        if (timeframe === "24h") {
            throw new functions.https.HttpsError("permission-denied", "Free users cannot access 24h real-time data.");
        }
        if (forceRefresh) {
            throw new functions.https.HttpsError("permission-denied", "Free users cannot force refresh trending data.");
        }
    }
    let effectiveTopics = topics;
    if (!isPro && topics.length > 3) {
        effectiveTopics = topics.slice(0, 3);
    }
    const cacheFreshness = getCacheFreshness(timeframe);
    let cachedNews = [];
    let cachedPosts = [];
    let useCache = false;
    if (topics.length > 0 && !forceRefresh) {
        const cacheAge = new Date(Date.now() - cacheFreshness);
        for (const topic of topics) {
            const topicLower = topic.toLowerCase();
            const snap = await firebase_1.db.collection('trending_cache')
                .where('topic', '==', topicLower)
                .limit(50)
                .get();
            if (!snap.empty) {
                snap.forEach(doc => {
                    var _a;
                    const item = doc.data();
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
    let news = [];
    let posts = [];
    if (!useCache) {
        if (type === "all" || type === "news") {
            if (effectiveTopics.length > 0) {
                const newsPromises = effectiveTopics.slice(0, 5).map((topic) => fetchGoogleNews(topic));
                const newsResults = await Promise.all(newsPromises);
                news = newsResults.flat();
            }
            else {
                const defaultTopics = ["Startup", "Technology", "Business"];
                const newsPromises = defaultTopics.map((topic) => fetchGoogleNews(topic));
                const newsResults = await Promise.all(newsPromises);
                news = newsResults.flat();
            }
            const seenLinks = new Set();
            news = news.filter(n => {
                if (seenLinks.has(n.link))
                    return false;
                seenLinks.add(n.link);
                return true;
            });
            news.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        }
        if (type === "all" || type === "posts") {
            let linkedInPosts = [];
            if (effectiveTopics.length > 0) {
                const linkedInPromises = effectiveTopics.slice(0, 3).map((topic) => fetchLinkedInPosts(topic));
                const linkedInResults = await Promise.all(linkedInPromises);
                const cutoff = getTimeframeCutoff(timeframe);
                linkedInPosts = linkedInResults.flat().filter(post => {
                    const postDate = new Date(post.createdUtc * 1000);
                    return postDate >= cutoff;
                });
                if (linkedInPosts.length > 0) {
                    const enrichmentPromises = linkedInPosts.slice(0, 5).map(post => enrichLinkedInPost(post));
                    const enrichedTop = await Promise.all(enrichmentPromises);
                    linkedInPosts = [...enrichedTop, ...linkedInPosts.slice(5)];
                }
            }
            const redditPosts = await fetchRedditPosts(topics, timeframe);
            posts = [...linkedInPosts, ...redditPosts];
        }
        const batch = firebase_1.db.batch();
        const nowIso = new Date().toISOString();
        let batchCount = 0;
        const cacheItem = (item, type, topic) => {
            const sourceId = type === 'news' ? item.link : item.permalink;
            const docId = `${topic}_${timeframe}_${Buffer.from(sourceId).toString('base64').substring(0, 100)}`.replace(/\//g, '_');
            // Ensure docId is valid path
            const safeDocId = docId.replace(/[^a-zA-Z0-9_]/g, '');
            const docRef = firebase_1.db.collection('trending_cache').doc(safeDocId || 'unknown');
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
exports.scheduledCleanup = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    console.log(`Starting cleanup of recommended_posts older than ${cutoffDate.toISOString()}`);
    const batchSize = 400;
    const snapshot = await firebase_1.db.collection('recommended_posts')
        .where('created_at', '<', cutoffDate.toISOString())
        .limit(batchSize)
        .get();
    if (snapshot.empty) {
        return null;
    }
    const batch = firebase_1.db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    return null;
});
exports.scheduledTopicWorker = functions.runWith({
    timeoutSeconds: 540,
    memory: "2GB"
}).pubsub.schedule('every 12 hours').onRun(async (context) => {
    try {
        const recentRecs = await firebase_1.db.collection("recommended_posts")
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
        const freshThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        for (const topic of topTopics) {
            const docSnap = await firebase_1.db.collection("topic_insights").doc(topic.toLowerCase()).get();
            if (docSnap.exists) {
                const data = docSnap.data();
                if (data && new Date(data.generated_at) > freshThreshold) {
                    continue;
                }
            }
            await generateTopicInsights(topic);
            await new Promise(r => setTimeout(r, 1000));
        }
        return null;
    }
    catch (e) {
        console.error("Topic Worker Failed", e);
        return null;
    }
});
//# sourceMappingURL=recommendations.js.map