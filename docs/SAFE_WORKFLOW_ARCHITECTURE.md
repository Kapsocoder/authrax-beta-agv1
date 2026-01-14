# Safe Development Workflow - Implemented Architecture

## Goal Description
To establish a robust development workflow that allows working on the next release and isolated features without conflicting with the live production application.

## Current Status: IMPLEMENTED
> [!NOTE]
> This workflow is fully active on the project.
> - **Active Branch**: `feat/enhancements-v1.1`
> - **Live Webhooks**: `n8n.authrax.com` (Production)
> - **Test Webhooks**: Configured via `.env.local`

## 1. Implemented Strategy

### Git Branching
- **`main`**: Production code.
- **`dev` / `feat/*`**: Active development branches.
- **Workflow**: All changes are committed to `feat/enhancements-v1.1` (or similar) before merging.

### Backend Isolation (Emulators)
- **Tool**: Firebase Emulator Suite (`npm run dev:emulators`).
- **Data Persistence**: Emulators now persist data to `./emulator-data` (see `package.json` scripts).
- **Function Safety**: Local functions run on port 5001 and do **not** overwrite production functions.

### Webhook Configuration
We have implemented strict separation of Production and Test n8n webhooks.

**In Code (`posts.ts`, `analyze_voice.ts`):**
```typescript
// Uses Environment Variable, falls back to Production URL
const url = process.env.N8N_GENERATE_WEBHOOK_URL || "https://n8n.authrax.com/webhook/..."
```

**Environment Files:**
1.  **Production**: Uses the hardcoded `n8n.authrax.com` URL (or `functions/.env`).
2.  **Development**: Uses `functions/.env.local` to override with Test URLs (e.g., `.../webhook-test/...`).

## 2. Emulator Data Workflow (Standard Operating Procedure)

We have established a strict data lifecycle for local development to ensure stability and freshness.

### 1. Fresh Data Sync (Offline/Independent)
*   **Command**: `npm run db:sync`
*   **What it does**:
    1.  Starts a temporary emulator instance.
    2.  Pulls the latest schema and data from **Production**.
    3.  Runs `db-sync-complete.cjs` (Sanitizes data, copies collections).
    4.  Runs `fix-main-user.cjs` (Ensures your local user has the correct Production UID).
    5.  **Saves** the fresh data to `./emulator-data` and exits.
*   **When to run**: Whenever you want to reset your local environment to match Production.

### 2. Daily Development (Start Server)
*   **Command**: `npm run dev:emulators`
*   **What it does**:
    1.  Starts the Emulators (Auth, Firestore, Functions, etc.).
    2.  **Imports** the data from `./emulator-data` (so you start where you left off).
    3.  **Auto-Saves** on exit (Ctrl+C).
*   **When to run**: Every time you start developing.

### 3. Live Save (Checkpoint)
*   **Command**: `npm run db:save`
*   **What it does**:
    1.  Connects to the *currently running* emulator.
    2.  Forces an immediate export of all data to `./emulator-data`.
*   **When to run**: If you have made significant changes in the emulator (e.g., created test posts) and want to ensure they are saved to disk *without* stopping the server.

## 3. How to Verify
1.  Run `npm run db:sync` to populate your local data.
2.  Run `npm run dev:emulators` to start the app.
3.  Navigate to `localhost:5173` and login.
