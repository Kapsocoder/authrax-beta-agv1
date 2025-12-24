# Data Migration Instructions

I have prepared a script `scripts/migrate_data.js` to migrate your exported Supabase data to Firebase Firestore.

## Data Quality Check
- **profiles.csv**: Found to be empty (only headers). Skipped.
- **posts.csv**: Contains data. Will be migrated to `posts` collection.
- **templates.csv**: Contains data. JSON fields (`themes`, `formats`, etc.) will be parsed. Migrated to `templates` collection.
- **recommended_posts.csv**: Contains data. Migrated to `recommended_posts`.
- **user_topics.csv**: Contains data. Migrated to `users/{uid}/topics` subcollections.

## How to Run

The script uses the Firebase Admin SDK and requires privileged access to your Firebase project `authrax-beta-lv1`.

1.  **Download Service Account Key**:
    *   Go to [Firebase Console > Project Settings > Service Accounts](https://console.firebase.google.com/project/authrax-beta-lv1/settings/serviceaccounts/adminsdk).
    *   Click "Generate new private key".
    *   Save the JSON file as `service-account.json` in the root of your project (`c:\Users\kapil\OneDrive\Business\Development\Authrax-Beta-Lv1\authrax\`).

2.  **Run the Script**:
    Open your terminal (PowerShell) and run:

    ```powershell
    $env:GOOGLE_APPLICATION_CREDENTIALS="service-account.json"
    node scripts/migrate_data.js
    ```

    (If using Command Prompt/cmd, use `set GOOGLE_APPLICATION_CREDENTIALS=service-account.json` then `node scripts/migrate_data.js`)

3.  **Verify**:
    Check your Firestore Request Monitor or Data tab to see the new collections populated.
