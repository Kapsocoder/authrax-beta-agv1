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

This project uses a hybrid AI approach:
*   **Google AI Studio** (for text/recommendations) -> Requires API Key.
*   **Google Vertex AI** (for image generation) -> Requires GCP Service Account Permissions.

### 1. Environment Variables

```sh
# Set Google Gemini API Key (Required for Recommendations)
firebase functions:config:set google.api_key="YOUR_GEMINI_API_KEY"

# Set Stripe Configuration (Optional)
firebase functions:config:set stripe.secret_key="..." stripe.webhook_secret="..."
```

### 2. Vertex AI Setup (CRITICAL for Image Gen)

For the "Generate Image" feature to work, you must enable the Vertex AI API and grant permissions to your Firebase Service Account:

1.  **Enable API:** Go to Google Cloud Console > "Vertex AI API" > **Enable**.
2.  **Grant Permissions (IAM):**
    *   Find your service account email (usually `firebase-adminsdk-xxxxx@YOUR-PROJECT.iam.gserviceaccount.com`).
    *   Go to **IAM & Admin > IAM**.
    *   Edit the service account and add the role: **`Vertex AI User`**.

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
- **AI**: Google Gemini & Vertex AI (Imagen 2)

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
