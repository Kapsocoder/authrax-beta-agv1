# Authrax

AI-powered social media post generator and scheduling platform.

## Project info

This project is a modern web application designed to help users generate, schedule, and manage social media content using AI (Gemini).

## Getting Started

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/Kapsocoder/authrax-beta-agv1.git
   cd authrax-beta-agv1
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. **Configure Environment**:
   - Copy `.env.example` to `.env`:
     ```sh
     cp .env.example .env
     ```
   - Fill in your Firebase project details in `.env`.

4. Start the development server:
   ```sh
   npm run dev
   ```

   The application will be available at `http://localhost:8080`.

## Backend Configuration (Firebase Functions)

This project uses Firebase Cloud Functions for AI generation. You must configure the backend environment variables:

```sh
# Set Google Gemini API Key
firebase functions:config:set google.api_key="YOUR_GEMINI_API_KEY"

# Set Stripe Configuration (Optional)
firebase functions:config:set stripe.secret_key="..." stripe.webhook_secret="..."
```

To deploy functions:
```sh
firebase deploy --only functions
```

## Useful Scripts

The `scripts/` directory contains utilities for data migration and scraping:

| Script | Description |
|Args|Usage|
|---|---|
| `scripts/migrate_data.js` | Migrates data from JSON/CSV files to Firestore | `node scripts/migrate_data.js` |
| `scripts/extract_docx.js` | Extracts content from DOCX files for templates | `node scripts/extract_docx.js` |
| `scripts/scrape_linkedin_reactions.js` | Scrapes LinkedIn reaction counts (pupetter) | `node scripts/scrape_linkedin_reactions.js` |

## Technologies Used

- **Frontend**: Vite, React, TypeScript, Tailwind CSS, shadcn-ui
- **Backend**: Firebase Authentication, Firestore, Cloud Functions
- **AI**: Google Gemini (via Cloud Functions)

## Development structure

- `src/`: Frontend source code
- `functions/`: Backend Cloud Functions code
- `scripts/`: Utility scripts for maintenance and data tasks
- `data_export/`: CSV/JSON data used for migration or analysis

## Deployment

To build and deploy the entire project:

```sh
npm run build
firebase deploy
```
