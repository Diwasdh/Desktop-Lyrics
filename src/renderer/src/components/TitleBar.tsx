import React from 'react';
import {
  Pin,
  PinOff,
  Maximize2,
  Minimize2,
  Settings,
  Search,
  X,
  Minus,
  Eye,
  EyeOff,
  LayoutTemplate,
  Sparkles,
  RectangleHorizontal
} from 'lucide-react';
import { PlaybackStatus, WindowMode } from '../types';

interface TitleBarProps {
  status: PlaybackStatus;
  appName?: string;
  mode: WindowMode;
  alwaysOnTop: boolean;
  clickThrough: boolean;
  transparentMode: boolean;
  onToggleMode: (mode: WindowMode) => void;
  onToggleAlwaysOnTop: () => void;
  onToggleClickThrough: () => void;
  onToggleTransparentMode: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  status,
  appName,
  mode,
  alwaysOnTop,
  clickThrough,
  transparentMode,
  onToggleMode,
  onToggleAlwaysOnTop,
  onToggleClickThrough,
  onToggleTransparentMode,
  onOpenSettings,
  onOpenSearch,
  onMinimize,
  onClose,
}) => {
  return (
    <div
      className="window-titlebar"
      onMouseEnter={() => {
        if (clickThrough && window.desktopLyrics) {
          window.desktopLyrics.setIgnoreMouseEvents(false);
        }
      }}
      onMouseLeave={() => {
        if (clickThrough && window.desktopLyrics) {
          window.desktopLyrics.setIgnoreMouseEvents(true, true);
        }
      }}
    >
      <div className="title-badge">
        <img src="./logo_icon.svg" className="titlebar-logo" alt="Desktop Lyrics Logo" />
        <div
          className={`dot ${status === 'Playing' ? '' : status === 'Paused' ? 'paused' : 'stopped'}`}
        />
        <div className={`sound-wave ${status === 'Playing' ? 'playing' : ''}`}>
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
        </div>
        <span>{appName || 'Universal Lyrics'}</span>
      </div>

      <div className="titlebar-actions no-drag">
        {/* Mode Switchers */}
        <button
          className={`icon-btn ${mode === 'widget' ? 'active' : ''}`}
          onClick={() => onToggleMode('widget')}
          title="Floating Widget Mode"
        >
          <LayoutTemplate size={13} />
        </button>
        <button
          className={`icon-btn ${mode === 'full' ? 'active' : ''}`}
          onClick={() => onToggleMode('full')}
          title="Full Lyrics Canvas Mode"
        >
          <Maximize2 size={13} />
        </button>
        <button
          className={`icon-btn ${mode === 'compact' ? 'active' : ''}`}
          onClick={() => onToggleMode('compact')}
          title="Compact Bar Mode"
        >
          <Minimize2 size={13} />
        </button>
        <button
          className={`icon-btn ${mode === 'island' ? 'active' : ''}`}
          onClick={() => onToggleMode('island')}
          title="Top Dynamic Island Mode (Only Lyrics at Top Center)"
        >
          <RectangleHorizontal size={13} />
        </button>

        {/* Transparent Mode Toggle */}
        <button
          className={`icon-btn ${transparentMode ? 'active' : ''}`}
          onClick={onToggleTransparentMode}
          title={transparentMode ? 'Transparent Mode: ON (Click for Solid Card)' : 'Transparent Mode: OFF (Click for Glass Floating)'}
        >
          <Sparkles size={13} />
        </button>

        {/* Pin / Always on Top */}
        <button
          className={`icon-btn ${alwaysOnTop ? 'active' : ''}`}
          onClick={onToggleAlwaysOnTop}
          title={alwaysOnTop ? 'Always on top (Enabled)' : 'Always on top (Disabled)'}
        >
          {alwaysOnTop ? <Pin size={13} /> : <PinOff size={13} />}
        </button>

        {/* Click Through Toggle */}
        <button
          className={`icon-btn ${clickThrough ? 'active' : ''}`}
          onClick={onToggleClickThrough}
          title={clickThrough ? 'Click-Through: ON (Ctrl+Shift+X or hover top bar to disable)' : 'Click-Through: OFF (Click to pass through to desktop/games)'}
        >
          {clickThrough ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>

        {/* Search Lyrics */}
        <button className="icon-btn" onClick={onOpenSearch} title="Search / Fix Lyrics">
          <Search size={13} />
        </button>

        {/* Settings */}
        <button className="icon-btn" onClick={onOpenSettings} title="Settings & Appearance">
          <Settings size={13} />
        </button>

        {/* Window controls */}
        <button className="icon-btn" onClick={onMinimize} title="Minimize to Tray">
          <Minus size={13} />
        </button>
        <button className="icon-btn danger" onClick={onClose} title="Close">
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
