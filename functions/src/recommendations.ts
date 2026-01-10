import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import axios from 'axios';
import { db, GEMINI_API_KEY } from './firebase';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// --- Helper Functions ---

function getTimeframeCutoff(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
        case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case "30d": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case "7d": default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
}

function getCacheFreshness(timeframe: string): number {
    switch (timeframe) {
        case "24h": return 60 * 60 * 1000;
        case "30d": return 24 * 60 * 60 * 1000;
        case "7d": default: return 6 * 60 * 60 * 1000;
    }
}

async function parseRSSFeed(feedUrl: string, source: string, category: string): Promise<any[]> {
    try {
        const response = await axios.get(feedUrl, {
            headers: { "User-Agent": "TrendingBot/1.0" },
            timeout: 10000
        });

        if (response.status !== 200) return [];

        const text = response.data;
        const items: any[] = [];
        const itemMatches = text.match(/<item>[\s\S]*?<\/item>/g) || [];

        for (const itemXml of itemMatches.slice(0, 15)) {
            const title = itemXml.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || "";
            const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
            const description = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)?.[1] || "";
            const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

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
    } catch (error) {
        console.error(`Error parsing ${source}:`, error);
        return [];
    }
}

async function fetchRSS(query: string, sourceName: string, category: string): Promise<any[]> {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
        return await parseRSSFeed(url, sourceName, category);
    } catch (error) {
        console.error(`Error fetching RSS for ${query}:`, error);
        return [];
    }
}

async function fetchGoogleNews(topic: string): Promise<any[]> {
    return fetchRSS(topic, "Google News", "news");
}

async function fetchLinkedInPosts(topic: string): Promise<any[]> {
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

async function fetchRedditPosts(topics: string[], timeframe: string): Promise<any[]> {
    const posts: any[] = [];
    const cutoff = getTimeframeCutoff(timeframe);
    const redditTimeFilter = timeframe === "24h" ? "day" : timeframe === "30d" ? "month" : "week";

    const fetchDefaults = async () => {
        const subreddits = ["Entrepreneur", "startups", "technology", "business", "productivity"];
        for (const subreddit of subreddits) {
            try {
                const response = await axios.get(
                    `https://www.reddit.com/r/${subreddit}/top.json?t=${redditTimeFilter}&limit=10`,
                    {
                        headers: { "User-Agent": "AuthraxBot/1.0" },
                        timeout: 10000
                    }
                );

                if (response.status !== 200) continue;

                const data = response.data;
                const children = data?.data?.children || [];

                for (const child of children) {
                    const post = child.data;
                    if (post.stickied || post.over_18) continue;
                    if (new Date(post.created_utc * 1000) < cutoff) continue;

                    posts.push({ ...formatRedditPost(post), topic: subreddit });
                }
            } catch (e) { console.error(`Error fetching r/${subreddit}`, e); }
        }
    };

    const formatRedditPost = (post: any) => ({
        title: post.title,
        url: post.url,
        subreddit: post.subreddit,
        score: post.score,
        numComments: post.num_comments,
        author: post.author,
        createdUtc: post.created_utc,
        selftext: post.selftext?.substring(0, 300) || "",
        permalink: `https://reddit.com${post.permalink}`,
    });

    if (topics.length === 0) {
        await fetchDefaults();
    } else {
        for (const topic of topics.slice(0, 5)) {
            try {
                const encodedTopic = encodeURIComponent(topic);
                const response = await axios.get(`https://www.reddit.com/search.json?q=${encodedTopic}&sort=top&t=${redditTimeFilter}&limit=10`, {
                    headers: { "User-Agent": "AuthraxBot/1.0" },
                    timeout: 10000
                });

                if (response.status !== 200) continue;

                const data = response.data;
                const children = data?.data?.children || [];

                for (const child of children) {
                    const post = child.data;
                    if (post.stickied || post.over_18) continue;
                    const postDate = new Date(post.created_utc * 1000);
                    if (postDate < cutoff) continue;
                    posts.push({ ...formatRedditPost(post), topic });
                }
            } catch (error) {
                console.error(`Error searching Reddit for ${topic}:`, error);
            }
        }

        if (posts.length === 0) {
            await fetchDefaults();
        }
    }

    const seen = new Set();
    return posts.filter(p => {
        if (seen.has(p.permalink)) return false;
        seen.add(p.permalink);
        return true;
    }).sort((a, b) => b.score - a.score).slice(0, 25);
}

async function enrichLinkedInPost(post: any): Promise<any> {
    return post;
}

async function cacheTrendingItems(items: any[], type: 'news' | 'post', topic: string) {
    if (items.length === 0) return;
    const batch = db.batch();
    const nowIso = new Date().toISOString();
    let batchCount = 0;

    items.forEach(item => {
        const sourceId = type === 'news' ? item.link : item.permalink;
        if (!sourceId) return;

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

    if (batchCount > 0) await batch.commit();
}

async function generateTopicInsights(topic: string): Promise<any[]> {
    try {
        const topicLower = topic.toLowerCase();
        const cacheAge = new Date(Date.now() - 24 * 60 * 60 * 1000);

        let snapshot = await db.collection("trending_cache")
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
                fetchLinkedInPosts(topic) // Ensure this function doesn't fail silently
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
            trendingContext = "Trending now:\n" + relevantItems.map(i => `- ${i.title} (${i.description?.substring(0, 100)}...)`).join("\n");
        } else {
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

        console.log(`[DEBUG] Generative Model Name: ${model.model}`);

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json"
            },
            // Reduce safety settings to avoid blocking news content
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
                }
            ]
        });

        const response = await result.response;
        const text = response.text();
        // Clean up markdown just in case, though responseMimeType handles most
        const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const json = JSON.parse(cleanedText);
        const insights = json.insights || (Array.isArray(json) ? json : []);

        if (insights.length > 0) {
            await db.collection("topic_insights").doc(topic.toLowerCase()).set({
                topic: topic.toLowerCase(),
                insights: insights,
                generated_at: new Date().toISOString(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        return insights;

    } catch (e: any) {
        console.error(`Failed to generate insights for topic ${topic}. Error: ${e.message}`, JSON.stringify(e, null, 2));

        // Diagnostic: List available models to find the correct name
        try {
            // We need to use a temporary model client to list models or the genAI instance
            // The SDK doesn't have a direct 'listModels' on genAI instance in older versions, 
            // but let's try the key valid check or just log what we can.
            // Actually, the error message itself suggests calling ListModels.
            // We can't easily do it without importing the ModelService or similar often.
            // Let's try to just log that we need to check the model list documentation.
            console.log("Attempting to list models intentionally failed - functionality complex to add inline.");
        } catch (listErr) {
            console.error("Failed to list models", listErr);
        }

        // If 404, it means model name is wrong. 
        return [];
    }
}

// --- Exported Functions ---

export const generateRecommendations = functions.runWith({
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
            } catch (e) {
                res.status(401).json({ error: "Invalid token" });
                return;
            }

            const { userId, topics, forceRefresh } = req.body;

            const userDocRel = await db.doc(`users/${decodedToken.uid}`).get();
            const userDataRel = userDocRel.data();
            const isPro = userDataRel?.subscription_tier === 'pro';
            const effectiveForceRefresh = isPro ? forceRefresh : false;

            let effectiveTopics = topics;
            if (!isPro && topics.length > 3) {
                effectiveTopics = topics.slice(0, 3);
            }

            if (!GEMINI_API_KEY || GEMINI_API_KEY === "dummy_key") {
                console.error("GEMINI_API_KEY is missing or invalid");
                res.status(412).json({ error: "AI configuration error: API Key missing" });
                return;
            }

            const recommendations: any[] = [];
            const freshThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            for (const topic of effectiveTopics) {
                const topicLower = topic.toLowerCase();
                let insights = [];
                if (!effectiveForceRefresh) {
                    const insightDoc = await db.collection("topic_insights").doc(topicLower).get();
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
                    insights.forEach((insight: any) => {
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
                const batch = db.batch();
                recommendations.forEach((rec: any) => {
                    const docRef = db.collection("recommended_posts").doc();
                    batch.set(docRef, rec);
                });
                await batch.commit();
            }

            res.json({ success: true, recommendations });

        } catch (error: any) {
            console.error("Error generating recommendations:", error);
            res.status(500).json({ error: error.message || "Failed to generate recommendations" });
        }
    });
});

export const fetchTrending = functions.runWith({
    timeoutSeconds: 300,
    memory: "2GB",
}).https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required");

    const { topics = [], page = 1, type = "all", timeframe = "7d", forceRefresh = false } = data as {
        topics: string[],
        page: number,
        type: string,
        timeframe: string,
        forceRefresh: boolean
    };
    const userId = context.auth.uid;

    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    const isPro = userData?.subscription_tier === 'pro';
    const adminOverrides = userData?.admin_overrides || {};
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
    let cachedNews: any[] = [];
    let cachedPosts: any[] = [];
    let useCache = false;

    if (topics.length > 0 && !forceRefresh) {
        const cacheAge = new Date(Date.now() - cacheFreshness);

        for (const topic of topics) {
            const topicLower = topic.toLowerCase();
            const snap = await db.collection('trending_cache')
                .where('topic', '==', topicLower)
                .limit(50)
                .get();

            if (!snap.empty) {
                snap.forEach(doc => {
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
                                category: item.category,
                                topic: item.topic // Add topic from cache
                            });
                        } else if (item.item_type === 'post') {
                            cachedPosts.push({
                                title: item.title,
                                url: item.source_url,
                                subreddit: item.source_name?.replace('r/', ''),
                                score: item.score,
                                numComments: item.num_comments,
                                author: item.author,
                                createdUtc: new Date(item.published_at).getTime() / 1000,
                                selftext: item.description,
                                permalink: item.source_url,
                                topic: item.topic // Add topic from cache
                            });
                        }
                    }
                });
            }
        }
    }

    let news: any[] = [];
    let posts: any[] = [];

    if (!useCache) {
        if (type === "all" || type === "news") {
            if (effectiveTopics.length > 0) {
                const newsPromises = effectiveTopics.slice(0, 5).map(async (topic: string) => {
                    const items = await fetchGoogleNews(topic);
                    return items.map(i => ({ ...i, topic }));
                });
                const newsResults = await Promise.all(newsPromises);
                news = newsResults.flat();
            } else {
                const defaultTopics = ["Startup", "Technology", "Business"];
                const newsPromises = defaultTopics.map(async (topic: string) => {
                    const items = await fetchGoogleNews(topic);
                    return items.map(i => ({ ...i, topic }));
                });
                const newsResults = await Promise.all(newsPromises);
                news = newsResults.flat();
            }

            const seenLinks = new Set();
            news = news.filter(n => {
                if (seenLinks.has(n.link)) return false;
                seenLinks.add(n.link);
                return true;
            });
            news.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        }

        if (type === "all" || type === "posts") {
            let linkedInPosts: any[] = [];
            if (effectiveTopics.length > 0) {
                const linkedInPromises = effectiveTopics.slice(0, 3).map(async (topic: string) => {
                    const items = await fetchLinkedInPosts(topic);
                    return items.map(i => ({ ...i, topic }));
                });
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

        const batch = db.batch();
        const nowIso = new Date().toISOString();
        let batchCount = 0;

        const cacheItem = (item: any, type: 'news' | 'post', topic: string) => {
            const sourceId = type === 'news' ? item.link : item.permalink;
            const docId = `${topic}_${timeframe}_${Buffer.from(sourceId).toString('base64').substring(0, 100)}`.replace(/\//g, '_');
            // Ensure docId is valid path
            const safeDocId = docId.replace(/[^a-zA-Z0-9_]/g, '');

            const docRef = db.collection('trending_cache').doc(safeDocId || 'unknown');

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
            topics.forEach((topic: string) => {
                news.slice(0, 5).forEach(n => cacheItem(n, 'news', topic.toLowerCase()));
                posts.slice(0, 5).forEach(p => cacheItem(p, 'post', topic.toLowerCase()));
            });
        }

        if (batchCount > 0) await batch.commit();

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

export const scheduledCleanup = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(`Starting cleanup of recommended_posts older than ${cutoffDate.toISOString()}`);

    const batchSize = 400;
    const snapshot = await db.collection('recommended_posts')
        .where('created_at', '<', cutoffDate.toISOString())
        .limit(batchSize)
        .get();

    if (snapshot.empty) {
        return null;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
    return null;
});

export const scheduledTopicWorker = functions.runWith({
    timeoutSeconds: 540,
    memory: "2GB"
}).pubsub.schedule('every 12 hours').onRun(async (context) => {
    try {
        const recentRecs = await db.collection("recommended_posts")
            .orderBy("created_at", "desc")
            .limit(1000)
            .get();

        const topicCounts: Record<string, number> = {};
        recentRecs.docs.forEach(doc => {
            const t = doc.data().topic;
            if (t) topicCounts[t] = (topicCounts[t] || 0) + 1;
        });

        const topTopics = Object.entries(topicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50)
            .map(e => e[0]);

        const freshThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        for (const topic of topTopics) {
            const docSnap = await db.collection("topic_insights").doc(topic.toLowerCase()).get();
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
    } catch (e) {
        console.error("Topic Worker Failed", e);
        return null;
    }
});
