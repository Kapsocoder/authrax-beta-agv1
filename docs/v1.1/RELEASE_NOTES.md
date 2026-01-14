# Release Notes - v1.1 (January 2026)

**Release Date:** 2026-01-14
**Status:** Deployed to Production

## Summary
Release v1.1 focuses on enhancing the user's content lifecycle management with a new **Published Posts** view and significantly upgrading the **Recommendations Engine** with Gemini 2.0 Flash. This release also consolidates critical hotfixes for LinkedIn publishing and production infrastructure.

## New Features
*   **Published Posts View:**
    *   Dedicated page to view history of published LinkedIn posts.
    *   Filtering by date (Week, Month, All) and text search capabilities.
    *   Detail view for each post.
*   **Intelligent Recommendations (Gemini 2.0):**
    *   Upgraded AI engine to **Gemini 2.0 Flash** for faster, higher-quality topic insights.
    *   Granular RSS parsing for better source material.
    *   Caching optimizations for performance.
*   **Scheduled Publishing:**
    *   Backend infrastructure to automatically publish scheduled posts to LinkedIn.

## Enhancements
*   **Draft Resumption:** Improved logic for resuming drafts, ensuring "What's on your mind?" context is handled correctly.
*   **UI/UX Polish:** Visual updates to the Landing Page previews and Mobile Navigation icons.
*   **Strict Mode AI Generation:** Hardened input validation for the `generatePost` cloud function.

## Critical Fixes
*   **LinkedIn Image Upload:** Fixed the API flow to use `registerUpload` + `PUT` mechanism, resolving image publishing failures.
*   **Production Webhooks:** Switched all generative AI features to use the stable **Production n8n Webhook** instance.
*   **Timeouts:** Increased Client-side and Cloud Function timeouts (to 5 minutes) to prevent premature failures during complex generation tasks.

## Infrastructure
*   **Security Rules:** Confirmed identical Match between Local and Production Firestore/Storage rules.
*   **Schedule Cleanup:** Automated job to clean up old recommendation data (90 days retention).
