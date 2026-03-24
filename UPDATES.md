# Latest Updates (MindRoots)

Based on the last 2 commits to the repository, here are the detailed updates and features that have been recently implemented:

## 1. Web App Manifest & Favicon Integration 
**Commit Date:** March 24, 2026
**Commit Hash:** `e6b258eab79`

### Changes Implemented:
- **Full Favicon Suite Added:** Integrated a comprehensive set of app icons including `.ico`, `.svg`, and multiple `.png` web manifest sizes.
- **Apple Touch Support:** Added `apple-touch-icon.png` to correctly support iOS home-screen additions.
- **Root Metadata Overhaul:** Configured the global Next.js metadata inside `src/app/layout.js` to correctly link and render all provided favicon assets natively across various devices and browsers.
- **Webmanifest Installed:** Hooked up `site.webmanifest` to ensure Progressive Web App (PWA) compatibility.

## 2. Core AI Interview Page & Sound Management
**Commit Date:** March 24, 2026
**Commit Hash:** `73db8257350`

### Changes Implemented:
- **UI Sound Effects:** Hooked up interactive, non-voice sound effects for actions inside the AI interview page.
- **Microphone Toggles:** Users now hear `mic-on.wav` and `mic-off.wav` when toggling their microphone state.
- **Insight Discovery Cues:** Played a notification chime (`insight-found.mp3`) in the background whenever the AI discovers and maps a new belief or insight out of the conversation.
- **Centralized Audio Handling:** All audio plays securely through a unified `audioManager` store, preventing sound overlaps and audio-stalling bugs.
- **Interview Flow UI Updates:** Updated the visual ticker to display varied node tags extracted in real-time, matching the new audio infrastructure perfectly.
