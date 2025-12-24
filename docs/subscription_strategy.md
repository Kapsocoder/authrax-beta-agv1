# Authrax Subscription Strategy & Implementation Review

**Last Updated:** Dec 2024
**Status:** Implemented

## 1. Strategy Overview

Authrax uses a **Freemium** model designed to give users a taste of the platform's power while strictly gating advanced features to drive conversion.

-   **Free Tier:** Designed for trial utility. Users can experience the "Magic" (Post Generation, Voice Analysis) but with strict frequency caps that prevent professional use.
-   **Pro Tier:** Unlock unlimited access. $19.90/mo with a **10-Day Free Trial** to lower the barrier to entry.
-   **Trial Strategy:** The "Free Trial" is an auto-subscribing trial. Users must provide payment details upfront. They get 10 days of Pro access, after which they are billed. This reduces churn compared to "opt-in" trials.

## 2. Feature Limits & Gates

The following limits are enforced both on the **Frontend** (UI blocking) and **Backend** (Security/Logic).

| Feature | Free Tier Limit | Pro Tier Limit | Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **Post Generation** | **1 Post / Week** | Unlimited | **Backend:** `generatePost` checks `weekly_usage`.<br>**Frontend:** `Create.tsx` checks `checkUsageLimit()`. |
| **Scheduling** | **Disabled** | Unlimited | **Frontend:** `Schedule.tsx` checks `checkFeatureAccess('schedule')`. |
| **Voice Training** | **2 Lifetime Analyses** | Unlimited | **Backend:** `analyzeVoice` increments/checks `voice_analysis_count`. |
| **Trending Topics** | **No Real-Time (24h)**<br>**No Manual Refresh** | Full Access | **Backend:** `fetchTrending` rejects `24h` & `forceRefresh`. |
| **Recommendations** | **Max 3 Topics** | **Max 20 Topics** | **Backend:** `generateRecommendations` slices user topics to 3. |
| **Drafts** | **Max 10 Active Drafts** | Unlimited | **Frontend:** `Drafts.tsx` prevents new creation if >= 10. |
| **Analytics** | **Limited to 7 Days** | Full History | **Frontend:** `Analytics.tsx` filters data view. |

## 3. Technical Implementation

### Backend (Firebase Cloud Functions)
-   **Usage Tracking:**
    -   User documents in Firestore (`users/{uid}`) track usage in a `weekly_usage` map: `{ count: number, start_date: string }`.
    -   This resets automatically (logic check on read/write) if `start_date` is > 7 days old.
-   **Stripe Integration:**
    -   `createStripeCheckoutSession` initializes a session with `subscription_data: { trial_period_days: 10 }`.
    -   It dynamically uses the `origin` passed from the client to ensure correct redirects (`success_url`, `cancel_url`).
    -   `handleStripeWebhook` listens for successful payments/subs to update `subscription_tier` in Firestore.
-   **Admin Overrides:**
    -   Developers can bypass all limits for a specific user by setting `admin_overrides: { bypass_limits: true }` on the user's Firestore document. Backend functions explicitly check this flag.

### Frontend (React)
-   **`useProfile` Hook:**
    -   Centralizes all limit logic.
    -   Exposes `checkFeatureAccess(featureName)` to easily gate UI elements.
    -   Exposes `checkUsageLimit()` for the generic post-generation cap.
    -   Exposes `effectiveIsPro` (combines real subscription status + admin overrides).
-   **`SubscriptionModal`:**
    -   Global modal triggered whenever a gated feature is accessed.
    -   Dynamically displays usage stats (e.g., "1/1 used").
    -   Initiates the Stripe Checkout flow with the 10-day trial offer.

## 4. Verification & Testing

To test this implementation without spending money:
1.  **Trial Flow:** Use Stripe Test Cards (e.g., `4242...`) to simulate a successful checkout.
2.  **Overrides:** Manually set `bypass_limits: true` in your Firestore user document to test Pro features instantly.
3.  **Limits:** Remove the override and attempt to generate >1 post or use scheduling to verify the block appears.
