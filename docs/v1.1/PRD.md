# Product Requirements Document (PRD): Authrax Release 1.1

## 1. Executive Summary
Authrax Release 1.1 represents a pivotal evolution from a basic content tool to an intelligent, personalized creative partner. The primary goal is to close the gap between *content consumption* and *content creation* by integrating smart discovery features directly into the creation workflow.

This release introduces "Brand DNA," a feature allowing users to train the AI on their unique voice, alongside a "Trending" and "Recommendations" engine that surfaces relevant industry news. By coupling these with a robust development environment overhaul, Release 1.1 aims to increase user retention, reduce "blank page syndrome," and ensure scalable technical foundations.

## 2. Mission
*   **Product Mission:** To empower professionals to create authentic, high-quality content effortlessly by combining personalized AI (Brand DNA) with real-time inspiration (Trending/Recommendations).
*   **Core Principles:**
    *   **Authenticity:** Content must sound like the user, not a generic AI.
    *   **Immediacy:** Trending topics and templates should be available instantly to capitalize on current events.
    *   **Seamlessness:** The transition from *reading* a trend to *posting* about it should be frictionless.

## 3. Target Users
*   **Primary Persona:** The "Busy Thought Leader" (Executive, Founder, Consultant).
*   **Technical Comfort:** Moderate. They use tools like LinkedIn and SaaS platforms but value simplicity over configuration.
*   **Pain Points:**
    *   "I don't know what to post about today." (Solved by Trending/Recommendations)
    *   "AI content sounds robotic." (Solved by Brand DNA)
    *   "I lose my drafts or context when switching devices." (Solved by Drafts Persistence)

## 4. Scope

### In Scope (User Features)
- [x] **Brand DNA & Voice Profile:** Toggle to enable/disable; backend logic to include profile data in generation.
- [x] **Smart Discovery:** `/trending` page with topic badges; `/recommendations` page for personalized content.
- [x] **Content Workflow:** "Use this post" flow; "Trending Templates" (limit 3) for quick starts.
- [x] **Mobile Experience:** Fixed navigation bar, "Recording" button visibility, and logout UX.
- [x] **Bug Fixes:** Draft resumption logic, Image generation internal errors, Text formatting.

### Technical / Dev Requirements (Internal)
- [x] **Environment Parity:** Full local emulator setup with data persistence and dev/prod parity scripts (`db:reset`).

### Out of Scope (Deferred)
- [ ] Advanced Analytics Dashboard (beyond Google Analytics setup).
- [ ] Multi-platform scheduling (LinkedIn/X direct posting integration is foundational but full scheduling UI is later).
- [ ] Team/Collaboration features.

## 5. User Stories
1.  **As a** Thought Leader, **I want to** toggle "Brand DNA" on or off on my profile. **When ON**, generated posts sound uniquely like me. **When OFF**, posts are general/educational, allowing me to speak on broader topics without my specific brand voice.
2.  **As a** User, **I want to** see a list of Trending News topics, **so that** I can write timely content about my industry.
3.  **As a** User, **I want to** click "Use this post" on a recommended article, **so that** I am immediately taken to the editor with context pre-filled.
4.  **As a** Creator, **I want to** see exactly 3 "Trending Templates" (the most used across the platform) on the create screen, **so that** I have quick, proven options.

### Developer Experience (DX) Requirements
5.  **As a** Developer, **I want** my local development database to save data between restarts, **so that** I don't have to manually seed content every time I code.

## 6. Core Architecture & Patterns
*   **Frontend:** React (Vite) with explicit environment configuration for Emulator vs. Production.
*   **Backend:** Firebase Cloud Functions (Node.js).
    *   *Pattern:* "Implicit Context" - Functions like `generatePost` check Firestore for `voice_profiles` automatically rather than relying on frontend parameters.
*   **Database:** Cloud Firestore.
    *   *Schema Change:* Added composite indexes for `voice_profiles` (filtering by `is_trained` and `created_at`).
*   **Integration:** n8n Webhooks for AI processing pipelines (Brand DNA analysis, Post generation).

## 7. Tools & Features
*   **Brand DNA Engine:**
    *   *Input:* User toggles *usage* (ON/OFF) if an active voice profile exists.
    *   *Process:* Implicit backend fetch of active voice profile (only if `isActive` is true).
    *   *Output:* n8n payload includes `brand_dna` object or `null`.
*   **Discovery Engine:**
    *   *Trending:* Fetches external news, caches in Firestore, serves via valid CORS headers.
    *   *Recommendations:* Uses Cloud Functions (`httpsCallable`) to generate personalized suggestions.
*   **Dev Tools:**
    *   Scripts for `seed-from-prod`, `fix-main-user`, and `db:refresh`.

## 8. Technology Stack
*   **Frontend:** React, TypeScript, TailwindCSS, Shadcn/UI.
*   **Backend:** Firebase Functions (Node.js 18+).
*   **Database:** Firestore.
*   **Auth:** Firebase Auth (Emulator implementation matches Prod).
*   **AI/Orchestration:** n8n Webhooks.

## 9. Security & Configuration
*   **CORS:** Strict handling in Cloud Functions to allow localhost (dev) and production domains.
*   **Environment Variables:** `.env` files manage Webhook URLs; `firebaseConfig.ts` manages Emulator ports.
*   **Access Control:** All data fetching endpoints (`fetchTrending`, `generateRecommendations`) require authenticated user tokens (`context.auth`).

## 10. API Specification
*   `POST /fetchTrending`: Returns list of news items. Auth required.
*   `POST /generateRecommendations`: Triggers AI generation for user niche. Auth required.
*   `POST /generatePost`: Accepts `{ type, tone, templateId }`. Backend injects `brand_dna`.

## 11. Success Criteria
- [x] **Functional:** Users can toggle Brand DNA, and the output text changes style.
- [x] **Performance:** Trending page loads within 2 seconds (cached).
- [x] **Reliability:** Local environment retains data across restarts (`db:refresh` works).
- [x] **UX:** No "CORS" or "404" errors visible to the end user.

## 12. Risks & Mitigation
1.  **Risk:** Local Emulator data drift.
    *   *Mitigation:* Added `npm run db:refresh` to sync from Prod on demand.
2.  **Risk:** CORS errors on new Functions.
    *   *Mitigation:* Standardized `httpsCallable` on frontend and unified CORS middleware on backend.
3.  **Risk:** "Brand DNA" feeling invisible.
    *   *Mitigation:* Added "Brand DNA Active" status indicator on the Dashboard.

## 13. Appendix
*   **Related Docs:** `uat_report.md` (Verification Log).
*   **Repositories:** `authrax` (Monorepo).
