export type PlaybackStatus = 'Playing' | 'Paused' | 'Stopped' | 'Closed';

export type WindowMode = 'widget' | 'full' | 'compact' | 'island';

export interface MediaState {
  app: string;
  title: string;
  artist: string;
  album: string;
  status: PlaybackStatus;
  positionMs: number;
  durationMs: number;
  thumbnail: string;
  lastUpdatedTimestamp: number;
}

export interface LyricLine {
  id: number;
  timeMs: number;
  text: string;
  isInstrumental?: boolean;
}

export interface LyricsData {
  id?: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  syncedLyrics?: string;
  plainLyrics?: string;
  lines: LyricLine[];
  isSynced: boolean;
}

export interface AppSettings {
  mode: WindowMode;
  alwaysOnTop: boolean;
  clickThrough: boolean;
  transparentMode: boolean;
  opacity: number;
  theme: string;
  fontSize: 'small' | 'medium' | 'large' | 'huge';
  alignment: 'center' | 'left';
  showProgress: boolean;
  showAlbumArt: boolean;
  autoScroll: boolean;
  glowEffect: boolean;
}

export interface DesktopLyricsBridge {
  onMediaEvent: (callback: (event: { type: string; data: any; message?: string }) => void) => () => void;
  onModeChanged: (callback: (mode: WindowMode) => void) => () => void;
  onToggleClickThrough: (callback: (val: boolean) => void) => () => void;
  sendMediaCommand: (cmd: 'play' | 'pause' | 'toggle' | 'next' | 'previous') => void;
  setAlwaysOnTop: (val: boolean) => void;
  setClickThrough: (val: boolean) => void;
  setIgnoreMouseEvents: (ignore: boolean, forward?: boolean) => void;
  setOpacity: (val: number) => void;
  setWindowMode: (mode: WindowMode) => void;
  minimize: () => void;
  close: () => void;
  alignTopCenter: () => void;
}

declare global {
  interface Window {
    desktopLyrics?: DesktopLyricsBridge;
  }
}
