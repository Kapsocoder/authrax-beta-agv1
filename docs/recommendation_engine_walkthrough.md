# Recommendation Engine Implementation Walkthrough

This document details the technical implementation of the new **Topic-Centric Recommendation Engine**, designed to scale efficiently while enforcing strict usage limits for free users.

## 1. Limits & Retention (Frontend & Safety)

We implemented strict limits to control costs and drive conversion, along with data retention policies.

### A. Topic Limits (Free vs. Pro)
*   **Location**: `src/hooks/useUserTopics.tsx`
*   **Logic**:
    *   Intercepts the `addTopic` mutation.
    *   Checks `user.subscription_tier`.
    *   **Limit**: Max **3 topics** for Free users, **20** for Pro.
    *   **Action**: Throws an error if the user tries to add a 4th topic on the free plan.

### B. Usage Limits (1 Draft / Week)
*   **Location**: `src/hooks/useRecommendedPosts.tsx` & `src/pages/Recommendations.tsx`
*   **Logic**:
    *   Added a `usageQuery` that counts how many recommendations were marked as "used" (converted to draft) in the **current week** (since Sunday).
    *   If `count >= 1` and user is Free:
        *   `usage.isLimited` becomes `true`.
        *   The "Use This Post" button on cards is **Disabled**.
        *   Clicking the card opens the `SubscriptionModal` to prompt an upgrade.

### C. Data Retention (90 Days)
*   **Location**: `functions/src/index.ts` -> `scheduledCleanup`
*   **Logic**:
    *   Created a scheduled Cloud Function running every **24 hours**.
    *   Deletes all documents in `recommended_posts` collection where `created_at` is older than 90 days.
    *   Ensures database size remains manageable and compliant.

---

## 2. Backend Architecture Pivot (Topic-Centric)

We moved from an "On-Demand per User" model to a "Global Shared Cache" model to reduce AI costs by ~90%.

### A. The Core Concept
Instead of generating unique advice for every single user (e.g., 1000 users asking for "AI" = 1000 AI calls), we generate insights **once per topic** and share them.

*   **Global Collection**: `topic_insights` (Stores latest AI-generated hooks for "AI", "Marketing", etc.)
*   **User Collection**: `users/{uid}/recommended_posts` (Stores the specific posts assigned to a user)

### B. `generateRecommendations` Refactor
*   **Location**: `functions/src/index.ts`
*   **Flow**:
    1.  **Receive Request**: User asks for recommendations for topics `["AI", "SaaS"]`.
    2.  **Check Global Cache**: Look up `topic_insights/ai` and `topic_insights/saas`.
    3.  **Cache Hit (Fast Path)**:
        *   If the insight was generated **< 7 days ago**, we return it immediately.
        *   **Cost**: $0 AI. Latency: < 100ms.
    4.  **Cache Miss (Fallback)**:
        *   If no fresh insight exists (or Paid User requests "Force Refresh"), trigger **Generation Logic**.

### C. The Generation Logic (`generateTopicInsights`)
This helper function is the "brain" that actually creates content.
*   **Step 1: Context Fetch**: Checks `trending_cache` for raw news/posts about the topic.
*   **Step 2: Real-Time Scrape (New!)**:
    *   If the cache is empty or stale, it **actively scrapes** Google News and LinkedIn (via Puppeteer).
    *   This ensures that if a Paid User clicks "Generate New", they get **live, breaking data**, not old news.
*   **Step 3: AI Synthesis**: Calls Gemini to turn those raw news items into 3 engaging LinkedIn hooks.
*   **Step 4: Global Write**: Saves the result to `topic_insights` with `generated_at = now`.
    *   *Crucial*: This means the NEXT user who asks for this topic will now get a **Cache Hit**.

### D. The Background Worker (`scheduledTopicWorker`)
*   **Frequency**: Every 12 hours.
*   **Logic**:
    1.  Identifies the **Top 50 Active Topics** (based on what users are actually receiving).
    2.  **Delta Check**: Before generating, it checks `topic_insights`.
    3.  **Optimization**:
        *   If `topic_insights` was updated recently (e.g., by a Paid User via `generateTopicInsights` 2 hours ago), the worker **SKIPS** it.
        *   It only consumes resources for topics that have gone stale.
    4.  **Result**: Keeps the most popular topics fresh automatically, so free users almost always hit the cache.

---

## Summary of Benefits
1.  **Cost Efficiency**: Use shared insights for the 90% "Free Tier" majority.
2.  **Premium Value**: Paid users get to trigger "Real-Time" refreshing, which benefits the whole ecosystem.
3.  **Scalability**: The system no longer scales linearly with user count, but with *active topic count*.
