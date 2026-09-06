# Privacy Policy for Universal Desktop Lyrics

**Last Updated:** September 7, 2026

Universal Desktop Lyrics ("we", "our", or "the application") is an open-source, desktop software application designed to display synchronized lyrics on your computer.

Your privacy is a fundamental principle of this project. Universal Desktop Lyrics is built from the ground up with a **privacy-first, offline-friendly** architecture. We do not track you, sell your data, or collect any personally identifiable information (PII).

---

## 1. Summary (TL;DR)

- **Zero Telemetry & Analytics:** We do not collect, store, or transmit analytics, tracking pixels, or diagnostic telemetry.
- **No Accounts or Passwords:** You do not need an account, email address, or login to use the app.
- **Local-Only Media Processing:** Songs, artists, and playback positions are read strictly locally from your operating system's media session manager.
- **Transparent Network Requests:** Network access is strictly limited to retrieving public lyric data (via LRCLIB) when music plays or when you search for lyrics.
- **Fully Open Source:** You can inspect 100% of our code, native bridges, and network calls on GitHub.

---

## 2. Information Processed Locally on Your Device

The application accesses certain data locally on your computer to provide synchronized lyrics:

### A. Media Playback Metadata
- **Data:** Track title, artist name, album name, playback status (playing/paused), timeline position, and album art thumbnail.
- **Source:** 
  - On Windows: Native WinRT `GlobalSystemMediaTransportControlsSessionManager` (GSMTC).
  - On macOS: Scripting bridge via `osascript` connected directly to Spotify and Apple Music.
- **Purpose:** To know what song is currently playing so the app can fetch matching lyrics and sync active lines in real-time.
- **Retention:** Processed entirely in volatile memory (RAM) while the song plays. This information is **never** sent to any personal or developer servers.

### B. Application Preferences & Settings
- **Data:** Chosen display mode (Dynamic Island, Floating Widget, Compact Bar, Full Canvas), theme, window opacity, always-on-top status, and font preferences.
- **Storage:** Saved strictly in your local device's `localStorage`. This data never leaves your computer.

### C. Local Lyrics Cache
- **Data:** Synced and unsynced lyric text retrieved for previously played tracks.
- **Storage:** Cached in local storage on your device so songs load instantly without redundant network requests when replayed. You can clear this cache at any time by clearing the application's storage.

---

## 3. Network Communications (What Leaves Your Device)

The application makes outbound internet requests strictly to fulfill lyric lookup functionality:

### A. LRCLIB (Open Lyrics Database)
- When a new song is detected or when you use the Manual Search dialog, the app sends an HTTPS GET request to **[LRCLIB](https://lrclib.net)** (`https://lrclib.net/api/get` or `/api/search`) containing:
  - Cleaned song title
  - Artist name
  - Track duration (in seconds, used to ensure timing accuracy)
- **No user identity, persistent device fingerprint, or personal identifier is attached to these requests.**
- For information on how LRCLIB handles incoming HTTP requests, please refer to [LRCLIB](https://lrclib.net).

### B. Album Art & Web Thumbnails
- If the media player reports a remote thumbnail URL (such as some web-based media sessions), the image is loaded directly by Electron's renderer engine to display in the widget.

### C. Updates (GitHub Releases)
- If you check for updates, the app queries the public GitHub Releases API (`https://api.github.com/repos/Diwasdh/Desktop-Lyrics/releases`) to compare the latest version tag against your installed version.

---

## 4. What We Do NOT Collect

To be completely clear, Universal Desktop Lyrics **does not**:
- ❌ Collect personal identifiers (names, emails, IP addresses, physical addresses, phone numbers).
- ❌ Use analytics frameworks (e.g. Google Analytics, Mixpanel, Sentry, or Firebase).
- ❌ Access your microphone, camera, or audio recordings.
- ❌ Record keystrokes (keyboard shortcuts are only evaluated locally to control overlay visibility and playback).
- ❌ Read files or browsing history outside the application's own configuration folder.
- ❌ Serve advertisements or monetize user data.

---

## 5. Security & Data Protection

- All outbound queries to lyric providers use secure HTTPS encryption in transit.
- All window-to-native communications occur over Electron's secure `contextBridge` with Context Isolation enabled and Node.js integration disabled in the renderer process.
- Stored settings and cached lyrics are confined to standard sandbox storage paths provided by the operating system.

---

## 6. Open Source Verification

Because Universal Desktop Lyrics is released under the **MIT License**, our source code is completely public. You can audit our codebase, build scripts, and native bridges directly on GitHub:
👉 **[GitHub Repository](https://github.com/Diwasdh/Desktop-Lyrics)**

---

## 7. Changes to This Privacy Policy

If any future version introduces features that change how network data is communicated (such as new optional lyric providers), this Privacy Policy will be updated accordingly with a revised "Last Updated" date.

---

## 8. Contact & Feedback

If you have questions, feedback, or concerns regarding your privacy while using Universal Desktop Lyrics, please open an issue on GitHub:
- **Repository Issues:** [https://github.com/Diwasdh/Desktop-Lyrics/issues](https://github.com/Diwasdh/Desktop-Lyrics/issues)
- **Author:** Diwas Dhakal ([https://github.com/Diwasdh](https://github.com/Diwasdh))
