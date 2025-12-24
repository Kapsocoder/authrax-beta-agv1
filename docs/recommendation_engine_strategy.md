# Recommendation Engine Strategy & Roadmap

## Executive Summary
**Current Status**: Functional but unscalable.
The current engine operates on an **On-Demand (Pull)** model. When User A and User B both follow "AI Agents", the system performs two separate expensive operations.

**The Vision**: Shift to a **Topic-Centric (Push/Batch)** model. Generate insights *once* per topic, distribute to *many* users.

---

## 1. How is it working? (Current Architecture)
*   **Trigger**: User clicks "Generate" or page load checks expiry.
*   **Process**: Fetches trending data -> Calls LLM (Expensive O(N)).
*   **Output**: Saved to `recommended_posts`.

## 2. Strategic Pivot: "Write Once, Read Many"
To support 100s of users cost-effectively:

### A. The "Topic Insight" Layer (Backend)
Instead of generating recommendations *for the user*, generate them *for the topic*.
*   **Scheduled Job**: Periodically scan the "Top 50 Active Topics".
    *   *Definition of Top 50*: The 50 topics with the highest count of active user subscriptions across the entire platform. This ensures we prioritize processing for the content most users want to see.
*   **Batch Generation**: AI reads the news and generates diverse "Hooks/Concepts".
*   **Storage**: Store in a global `topic_insights` collection.

### B. The "Personalization" Layer (Frontend/API)
*   **User Action**: User visits Recommendations page.
*   **System Action**: Query `topic_insights` for the user's topics. Instant retrieval, zero AI cost at request time.

## 3. Cost Control & Monetization (Free vs. Paid)

| Feature | **Free Tier** | **Pro / Paid Tier** |
| :--- | :--- | :--- |
| **Recommendation Source** | **Global Cache Only**. | **Custom / Deep Dive**. Can request fresh info for niche topics. |
| **Freshness** | **Weekly**. A fresh post logic creates a new recommendation for each user topic once every 7 days. | "Generate New" button unlocks real-time scraping. |
| **Quantity** | **Max 3 topics**. | **Max 20 topics**. |
| **Actionability** | Can view hooks. **Limit: Draft 1 full post TOTAL per week from Recommendations.** | One-click "Draft Full Post" using premium templates. |

## 4. Making it Meaningful (User Value)
*   **Context is King**: Show the **Source** prominently (e.g., "Trending regarding [Article] from TechCrunch").
*   **Diversity**: Force the AI to generate 3 distinct angles for each topic (Contrarian, Analytical, Actionable).

## 5. Data Management & Cleanliness
*   **Firestore TTL**: Enable Firestore Time-to-Live on `recommended_posts` and `topic_insights` to auto-delete documents older than **90 Days**.
    *   *Rationale*: Allows users time to act on recommendations but prevents indefinite storage bloat.
*   **User Topic Limits**: Hard limits enforced at the DB/API level:
    *   **Free**: 3 Topics
    *   **Paid**: 20 Topics

## Implementation Roadmap
1.  **Immediate**: Enable Firestore TTL (90 Days).
2.  **Short Term**: Modify `generateRecommendations` to check global `topic_insights`.
3.  **Medium Term**: Build the "Topic Worker" scheduler and enforce the strict "1 Draft Total/Week" limit for free users.
