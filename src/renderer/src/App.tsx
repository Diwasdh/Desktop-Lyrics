import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TitleBar } from './components/TitleBar';
import { FloatingWidget } from './components/FloatingWidget';
import { LyricsCanvas } from './components/LyricsCanvas';
import { CompactBar } from './components/CompactBar';
import { IslandBar } from './components/IslandBar';
import { SettingsModal } from './components/SettingsModal';
import { ManualSearchModal } from './components/ManualSearchModal';
import { fetchLyrics } from './services/lyricsService';
import { findActiveLyricIndex } from './utils/lrcParser';
import { AppSettings, LyricsData, MediaState, WindowMode } from './types';

const DEFAULT_MEDIA: MediaState = {
  app: 'Universal Lyrics',
  title: '',
  artist: '',
  album: '',
  status: 'Stopped',
  positionMs: 0,
  durationMs: 0,
  thumbnail: '',
  lastUpdatedTimestamp: Date.now(),
};

const DEFAULT_SETTINGS: AppSettings = {
  mode: 'widget',
  alwaysOnTop: true,
  clickThrough: false,
  transparentMode: false,
  opacity: 0.95,
  theme: 'deep-space',
  fontSize: 'medium',
  alignment: 'left',
  showProgress: true,
  showAlbumArt: true,
  autoScroll: true,
  glowEffect: true,
};

export const App: React.FC = () => {
  const [media, setMedia] = useState<MediaState>(DEFAULT_MEDIA);
  const [currentPlaytimeMs, setCurrentPlaytimeMs] = useState<number>(0);
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('desktop_lyrics_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    console.log('Universal Desktop Lyrics mounted. Mode:', settings.mode);
    if (window.desktopLyrics) {
      window.desktopLyrics.setWindowMode(settings.mode);
    }
  }, []);

  // References to keep smooth timeline interpolation
  const mediaRef = useRef<MediaState>(media);
  mediaRef.current = media;
  const lyricsRef = useRef<LyricsData | null>(lyricsData);
  lyricsRef.current = lyricsData;

  // Sync settings to document theme
  useEffect(() => {
    document.body.dataset.theme = settings.theme;
  }, [settings.theme]);

  // Save settings
  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem('desktop_lyrics_settings', JSON.stringify(next));
      } catch {}

      if (partial.opacity !== undefined && window.desktopLyrics) {
        window.desktopLyrics.setOpacity(next.opacity);
      }
      if (partial.alwaysOnTop !== undefined && window.desktopLyrics) {
        window.desktopLyrics.setAlwaysOnTop(next.alwaysOnTop);
      }
      if (partial.clickThrough !== undefined && window.desktopLyrics) {
        window.desktopLyrics.setClickThrough(next.clickThrough);
      }
      if (partial.mode !== undefined && window.desktopLyrics) {
        window.desktopLyrics.setWindowMode(next.mode);
      }

      return next;
    });
  };

  // Switch window mode
  const handleToggleMode = (mode: WindowMode) => {
    updateSettings({ mode });
  };

  // Fetch lyrics whenever title or artist changes
  const loadLyricsForTrack = useCallback(async (title: string, artist: string, durationSecs: number) => {
    if (!title) {
      setLyricsData(null);
      setActiveLineIndex(-1);
      return;
    }

    try {
      const lyrics = await fetchLyrics(title, artist, durationSecs);
      setLyricsData(lyrics);
      if (lyrics && lyrics.lines.length > 0) {
        const idx = findActiveLyricIndex(lyrics.lines, mediaRef.current.positionMs);
        setActiveLineIndex(idx);
      } else {
        setActiveLineIndex(-1);
      }
    } catch (e) {
      console.error('Failed to load lyrics:', e);
    }
  }, []);

  // Listen to desktop media events from bridge
  useEffect(() => {
    if (!window.desktopLyrics) return;

    const unbindMedia = window.desktopLyrics.onMediaEvent((event) => {
      if (event.type === 'track_change') {
        const data = event.data;
        const newMedia: MediaState = {
          app: data.app || 'Music Player',
          title: data.title || '',
          artist: data.artist || '',
          album: data.album || '',
          status: data.status || 'Playing',
          positionMs: data.positionMs || 0,
          durationMs: data.durationMs || 0,
          thumbnail: data.thumbnail || '',
          lastUpdatedTimestamp: Date.now(),
        };

        setMedia(newMedia);
        setCurrentPlaytimeMs(newMedia.positionMs);
        loadLyricsForTrack(newMedia.title, newMedia.artist, newMedia.durationMs / 1000);
      } else if (event.type === 'timeline_tick') {
        const data = event.data;
        const newPos = data.positionMs !== undefined ? data.positionMs : mediaRef.current.positionMs;
        setMedia((prev) => ({
          ...prev,
          status: data.status !== undefined ? data.status : prev.status,
          positionMs: newPos,
          durationMs: data.durationMs !== undefined ? data.durationMs : prev.durationMs,
          lastUpdatedTimestamp: Date.now(),
        }));
        setCurrentPlaytimeMs(newPos);
      } else if (event.type === 'no_media') {
        setMedia((prev) => ({
          ...prev,
          title: '',
          artist: '',
          album: '',
          status: 'Stopped',
          positionMs: 0,
          durationMs: 0,
          thumbnail: '',
        }));
        setCurrentPlaytimeMs(0);
        setLyricsData(null);
        setActiveLineIndex(-1);
      }
    });

    const unbindMode = window.desktopLyrics.onModeChanged((mode) => {
      setSettings((prev) => ({ ...prev, mode }));
    });

    const unbindShortcut = window.desktopLyrics.onToggleClickThrough((val) => {
      setSettings((prev) => ({ ...prev, clickThrough: val }));
    });

    return () => {
      unbindMedia();
      unbindMode();
      unbindShortcut();
    };
  }, [loadLyricsForTrack]);

  // Smooth local timeline ticker & line sync
  useEffect(() => {
    let animFrame: number;

    const tick = () => {
      const current = mediaRef.current;
      const lyrics = lyricsRef.current;

      if (current.status === 'Playing') {
        const elapsedSinceSync = Date.now() - current.lastUpdatedTimestamp;
        const livePos = Math.min(
          current.durationMs > 0 ? current.durationMs : Infinity,
          current.positionMs + elapsedSinceSync
        );

        setCurrentPlaytimeMs(livePos);

        if (lyrics && lyrics.lines.length > 0) {
          const idx = findActiveLyricIndex(lyrics.lines, livePos);
          setActiveLineIndex(idx);
        }
      }

      animFrame = requestAnimationFrame(tick);
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Send controls to bridge
  const handleMediaCommand = (cmd: 'play' | 'pause' | 'toggle' | 'next' | 'previous') => {
    if (window.desktopLyrics) {
      window.desktopLyrics.sendMediaCommand(cmd);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleMediaCommand('toggle');
      } else if (e.code === 'ArrowRight' && e.ctrlKey) {
        handleMediaCommand('next');
      } else if (e.code === 'ArrowLeft' && e.ctrlKey) {
        handleMediaCommand('previous');
      } else if (e.key === 'Escape') {
        setIsSettingsOpen(false);
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isIsland = settings.mode === 'island';

  return (
    <div className={`app-container ${settings.transparentMode ? 'transparent-mode' : ''} ${isIsland ? 'island-mode' : ''}`}>
      {/* Background Animated Ambient Aura */}
      {!settings.transparentMode && !isIsland && <div className="ambient-aura" />}

      {/* Header Bar - Hidden in Top Dynamic Island Mode */}
      {!isIsland && (
        <TitleBar
          status={media.status}
          appName={media.app}
          mode={settings.mode}
          alwaysOnTop={settings.alwaysOnTop}
          clickThrough={settings.clickThrough}
          transparentMode={settings.transparentMode}
          onToggleMode={handleToggleMode}
          onToggleAlwaysOnTop={() => updateSettings({ alwaysOnTop: !settings.alwaysOnTop })}
          onToggleClickThrough={() => updateSettings({ clickThrough: !settings.clickThrough })}
          onToggleTransparentMode={() => updateSettings({ transparentMode: !settings.transparentMode })}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onMinimize={() => window.desktopLyrics?.minimize()}
          onClose={() => window.desktopLyrics?.close()}
        />
      )}

      {/* Main Content by Mode */}
      <div className="app-content">
        {settings.mode === 'widget' && (
          <FloatingWidget
            media={media}
            currentTimeMs={currentPlaytimeMs}
            lines={lyricsData?.lines || []}
            activeLineIndex={activeLineIndex}
            onCommand={handleMediaCommand}
            onExpand={() => handleToggleMode('full')}
          />
        )}

        {settings.mode === 'full' && (
          <LyricsCanvas
            media={media}
            currentTimeMs={currentPlaytimeMs}
            lines={lyricsData?.lines || []}
            activeLineIndex={activeLineIndex}
            isSynced={lyricsData?.isSynced ?? false}
            alignment={settings.alignment}
            fontSize={settings.fontSize}
            onCommand={handleMediaCommand}
          />
        )}

        {settings.mode === 'compact' && (
          <CompactBar
            media={media}
            lines={lyricsData?.lines || []}
            activeLineIndex={activeLineIndex}
            onCommand={handleMediaCommand}
            onExpand={() => handleToggleMode('widget')}
          />
        )}

        {settings.mode === 'island' && (
          <IslandBar
            media={media}
            lines={lyricsData?.lines || []}
            activeLineIndex={activeLineIndex}
            transparentMode={settings.transparentMode}
            clickThrough={settings.clickThrough}
            alwaysOnTop={settings.alwaysOnTop}
            onCommand={handleMediaCommand}
            onToggleMode={handleToggleMode}
            onToggleTransparentMode={() => updateSettings({ transparentMode: !settings.transparentMode })}
            onToggleClickThrough={() => updateSettings({ clickThrough: !settings.clickThrough })}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onMinimize={() => window.desktopLyrics?.minimize()}
            onClose={() => window.desktopLyrics?.close()}
          />
        )}
      </div>

      {/* Appearance & Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={updateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Manual Search Lyrics Modal */}
      {isSearchOpen && (
        <ManualSearchModal
          initialQuery={media.title ? `${media.artist} ${media.title}` : ''}
          onSelectLyrics={(lyrics) => {
            setLyricsData(lyrics);
            if (lyrics.lines.length > 0) {
              setActiveLineIndex(findActiveLyricIndex(lyrics.lines, media.positionMs));
            }
          }}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </div>
  );
};
