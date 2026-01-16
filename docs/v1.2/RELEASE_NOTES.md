# Release Notes - Authrax v1.2

**Release Date:** 16 January 2026
**Release Name:** Design Uplift

## Overview
This release focuses on a major visual overhaul of the Authrax application, introducing a premium "Skeuomorphic Modern" design system, rigorous dark/light theme support, and significant UI polish. The goal was to elevate the user experience to match the quality of the AI-generated content.

## Key Features

### 1. New Design System
- **Themes**: Introduced "Editorial Clean" (Light) and "Premium Glass" (Dark) themes.
- **Glassmorphism**: Unified translucent UI elements across the application using standardized `.glass` and `.glass-strong` utilities.
- **Typography & Colors**: Refined HSL color palette and typography for better readability and aesthetic appeal.

### 2. Dark Mode Implementation
- **Functional Toggle**: The Theme Toggle in Settings is now fully operational.
- **System Preference**: Added support for syncing with OS light/dark mode settings.
- **Dynamic Theming**: Removed hardcoded theme overrides, allowing all pages (including static pages like `/auth`, `/privacy`) to adapt dynamically.

### 3. UI Improvements
- **Sidebar**: Enhanced visual hierarchy, glass background, and branding updates ("Personal Branding").
- **Components**: Modernized Cards, Inputs, and Dialogs with softer borders and refined shadows.
- **Landing Page**: updated Hero section with improved dashboard previews.

## Bug Fixes
- **Theme Persistence**: Fixed issue where the app would force Dark Mode regardless of user setting.
- **Logo Spacing**: Resolved visual gaps around the logo in the Sidebar and header navigation.
- **Component Styling**: Fixed `TrendingTemplates` and `LinkedInPreview` components to correctly inherit theme colors instead of using hardcoded dark values.

## Technical Changes
- **Tailwind Config**: Extended configuration with new HSL variables and utility classes.
- **Theme Provider**: Added a robust `ThemeProvider` context to manage global application state.

## Known Issues
- None at time of release.
