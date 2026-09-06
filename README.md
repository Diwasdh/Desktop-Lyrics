# Universal Desktop Lyrics 🎵

A lightweight, universal desktop synced lyrics overlay for Windows 10 & 11. It automatically detects music playing anywhere on your PC (Spotify, Chrome, Edge, Apple Music, VLC, Firefox, etc.) and synchronizes real-time, line-by-line scrolling lyrics.

---

## ✨ Features

- **Universal Windows Media Detection (GSMTC)**:
  - Uses Windows native WinRT `GlobalSystemMediaTransportControlsSessionManager` to capture music playing in any application without any browser extensions or accounts needed.
  - Automatically captures track title, artist, album, album art thumbnail, playback state (Play/Pause), and exact millisecond timeline position.
  - Intelligent song title cleaner that strips YouTube suffixes like `(Official Video)`, `[Lyrics]`, `(feat. ...)`, and clean artist tags.

- **Synchronized LRC Lyrics (LRCLIB)**:
  - Integrated with the open LRCLIB database for synchronized millisecond-accurate lyrics.
  - Smooth Apple Music-style vertical kinetic scrolling.
  - Active line scaling & radiant ambient glow.
  - Dynamic ambient color aura matching your music.
  - Auto-scroll with smart manual scroll detection (pauses auto-scroll while you browse).
  - Instrumental break indicators (`♪ ♫ Instrumental ♫ ♪`).
  - Offline & local caching in LocalStorage for instant replay loading.

- **Four Display Modes**:
  1. **Top Dynamic Island**: Docked flush at the top center of your desktop with pure, glowing synchronized lyrics, zero title bar clutter, and click-to-snap alignment.
  2. **Floating Mini Widget**: Elegant glassmorphic floating card showing album art, active line, next line preview, and mini playback controls.
  3. **Full Lyrics Canvas**: Apple Music-inspired vertical kinetic scrolling lyrics with dynamic line glow, past line dimming, and smooth auto-scroll.
  4. **Compact Bar**: Slim pill bar with album art on the left and play button on the right.

- **Desktop Overlay Controls**:
  - **Always on Top**: Pinned on top of your windows, games, and apps.
  - **Transparent Mode**: Toggle between frosted glass card and pure floating transparent lyrics text.
  - **Click-Through (Ghost Mode)**: Click right through the lyrics overlay without interrupting your games or workflow (`Ctrl + Shift + X`).
  - **Hidden from Taskbar**: Runs cleanly as a desktop overlay without cluttering your Windows Taskbar (`skipTaskbar: true`).
  - **Customizable Opacity & Themes**: Deep Glass, Neon Aurora, Cyberpunk Neon, Midnight Minimal, and OLED Black.
  - **System Tray Integration**: Background tray menu to toggle overlay, switch modes, pin/unpin, and control playback.
  - **Manual Search & Correction**: Instant search dialog to find lyrics for rare, obscure, or custom tracks.

---

## 🚀 Quick Start

### 1. Build and Run
```bash
# Install dependencies
npm install

# Build the C# bridge, Electron scripts, and React frontend
npm run build

# Start the desktop application
npm start

# Or run in development mode with live rebuilds
npm run dev

# Package standalone installer & portable .exe
npm run dist
```

### 2. Controls & Shortcuts
- **Space**: Play / Pause media.
- **Ctrl + Right Arrow**: Skip to next track.
- **Ctrl + Left Arrow**: Skip to previous track.
- **Ctrl + Shift + X**: Toggle Click-Through (Ghost Mode) on/off.
- **Click on Dynamic Island**: Snap and re-align to top center.
- **Esc**: Close search or settings dialogs.

---

## 🏗️ Architecture

```
Desktop Lyrics/
├── native/
│   ├── win-media-bridge.cs     # C# WinRT GSMTC session & timeline monitor
│   ├── build-bridge.ps1        # Compiles bridge using Windows' built-in csc.exe
│   └── win-media-bridge.exe    # High-performance lightweight bridge (< 50KB)
├── src/
│   ├── main/
│   │   └── main.ts             # Electron main process, tray, window & IPC
│   ├── preload/
│   │   └── preload.ts          # Safe context bridge for media & window events
│   └── renderer/
│       ├── components/         # TitleBar, LyricsCanvas, FloatingWidget, Modals
│       ├── services/           # LRCLIB API client & YouTube title cleaner
│       ├── utils/              # LRC parser with instrumental detection
│       └── styles/index.css    # Premium glassmorphism & typography
└── dist/                       # Built web bundle & Electron scripts
```

---

## 📖 Developer Documentation

For in-depth architecture diagrams, IPC protocols, build pipelines, and contribution guides, see the [Developer Guide](DEVELOPER_GUIDE.md).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the [LICENSE](LICENSE) file for details.


