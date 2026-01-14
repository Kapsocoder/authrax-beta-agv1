# Authrax Release 1.1 Documentation

This folder contains the complete documentation for **Release 1.1** (Jan 2026).

## Files

*   **[Product Requirements (PRD)](./PRD.md)**:
    *   Defines the Scope, User Stories (Brand DNA, Trending), and Success Criteria.
    *   Separates "User Features" from "Technical Requirements".

*   **[UAT Report](./UAT_Report.md)**:
    *   Log of verification tests performed.
    *   Confirms pass/fail status for all features.

*   **[Implementation Log](./Implementation_Log.md)**:
    *   Technical details on the "Robust Persistence" architecture.
    *   Explanation of the `db:reset` and `db-sync` scripts.

## Key Workflows
To replicate the robust environment defined in these docs:
1.  **Reset:** `npm run db:reset`
2.  **Run:** `npm run dev:emulators`
