# Safe Development Workflow

## Overview
This project uses a safe development workflow to ensure changes do not break the live production application.
- **Frontend**: Preview Channels
- **Backend**: Local Emulators + Environment Variables

## Prerequisites
- **Java JDK 11+**: Required for Firebase Emulators. [Download JDK 17](https://adoptium.net/temurin/releases/).

## 1. Git Branching
- **`main`**: Production code.
- **`dev`**: Main development branch.
- **`feat/xyz`**: Isolated feature branches.

## 2. Running Locally (Backend + Frontend)
To run the full stack (including Cloud Functions) locally:
```bash
npm run dev:emulators
```
This starts:
- Firestore Emulator (8080)
- Functions Emulator (5001)
- Auth Emulator (9099)
- Hosting Emulator (5000)

### Data Persistence
The emulator now saves data to `./emulator-data` automatically on exit.
To reset or refresh data:
- **`npm run db:reset`**: Wipes local data and fixes the main user.
- **`npm run db:refresh`**: Seeds fresh data from production (if configured) and fixes the main user.

## 3. Environment Variables (Webhooks)
We use `.env` files in `functions/` to manage URLs.
- **Production**: Uses the hardcoded fallback or `functions/.env` (if deployed).
- **Development**: Create `functions/.env.local` to override values.

### Setup Test Webhook
1. Create `functions/.env.local`
2. Add your variable:
   ```
   N8N_WEBHOOK_URL="https://your-test-webhook-url"
   ```
3. Restart emulators.

## 4. Frontend Previews
To share a frontend change without deploying to prod:
```bash
firebase hosting:channel:deploy dev_preview
```
**Warning**: This preview URL still talks to the **Production Backend** unless you configured it otherwise. Be careful with data.
