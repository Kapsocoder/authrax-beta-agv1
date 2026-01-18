# Verification: Brand DNA Toggle Synchronization

## Objective
Confirm that the "Use Brand DNA" toggle is synchronized between the `/create` page and the `/profile` page.

## Analysis

### 1. Shared State Management
- **Files Analyzed**:
  - `src/hooks/useVoiceProfile.tsx`
  - `src/pages/Create.tsx`
  - `src/components/profile/VoiceTrainingSection.tsx`

### 2. Implementation Details
- **Single Source of Truth**: Both the Create page and the Profile page utilize the `useVoiceProfile` custom hook.
- **Data Fetching**: They share the exact same React Query key: `["voice-profile", user?.uid]`.
- **State Updates**:
  - When the toggle is clicked (on either page), it triggers `updateVoiceProfile.mutateAsync`.
  - The mutation's `onSuccess` callback executes `queryClient.invalidateQueries({ queryKey: ["voice-profile", user?.uid] });`.

## Conclusion
**Yes, the toggles are fully synchronized.**

Because they share the same underlying query cache and subscription:
1.  Toggling "On" in `/create` writes to the database.
2.  The app immediately refetches the profile data.
3.  The `/profile` page (and any other active component) automatically receives the new `isActive: true` state and updates its UI instantly.
