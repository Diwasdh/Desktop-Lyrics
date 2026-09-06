import React, { useState } from 'react';
import {
  Play,
  Pause,
  Sparkles,
  LayoutTemplate,
  Search,
  Settings,
  Minus,
  X,
  GripHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';
import { LyricLine, MediaState, WindowMode } from '../types';

interface IslandBarProps {
  media: MediaState;
  lines: LyricLine[];
  activeLineIndex: number;
  transparentMode: boolean;
  clickThrough: boolean;
  alwaysOnTop: boolean;
  onCommand: (cmd: 'play' | 'pause' | 'toggle' | 'next' | 'previous') => void;
  onToggleMode: (mode: WindowMode) => void;
  onToggleTransparentMode: () => void;
  onToggleClickThrough: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export const IslandBar: React.FC<IslandBarProps> = ({
  media,
  lines,
  activeLineIndex,
  transparentMode,
  clickThrough,
  onCommand,
  onToggleMode,
  onToggleTransparentMode,
  onToggleClickThrough,
  onOpenSearch,
  onOpenSettings,
  onMinimize,
  onClose,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const activeLine = activeLineIndex >= 0 && activeLineIndex < lines.length
    ? lines[activeLineIndex]
    : null;

  const isPlaying = media.status === 'Playing';

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (clickThrough && window.desktopLyrics) {
      window.desktopLyrics.setIgnoreMouseEvents(false);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (clickThrough && window.desktopLyrics) {
      window.desktopLyrics.setIgnoreMouseEvents(true, true);
    }
  };

  return (
    <div
      className={`island-capsule ${transparentMode ? 'island-transparent' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={() => window.desktopLyrics?.alignTopCenter()}
      title="Double click to snap to top middle"
    >
      {/* Left Hover Controls */}
      <div className="island-hover-controls left">
        <div className="island-grip" title="Drag to reposition">
          <GripHorizontal size={12} />
        </div>
        <button
          className="island-icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            onCommand(isPlaying ? 'pause' : 'play');
          }}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={10} /> : <Play size={10} />}
        </button>
      </div>

      {/* Dead-Center Pure Lyrics Text */}
      <div
        className="island-lyrics-center"
        onClick={(e) => {
          e.stopPropagation();
          window.desktopLyrics?.alignTopCenter();
        }}
        title="Click to snap to top middle"
      >
        {activeLine ? (
          <span
            key={`${activeLine.id}-${activeLine.timeMs}`}
            className="island-lyric-text active-glow"
          >
            {activeLine.text}
          </span>
        ) : (
          <span className="island-lyric-placeholder">
            {media.title ? (
              `${media.artist ? media.artist + ' - ' : ''}${media.title}`
            ) : (
              '♪ Universal Desktop Lyrics'
            )}
          </span>
        )}
      </div>

      {/* Right Hover Controls */}
      <div className="island-hover-controls right">
        <button
          className={`island-icon-btn ${transparentMode ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleTransparentMode();
          }}
          title={transparentMode ? 'Solid Glass Capsule' : 'Pure Transparent Lyrics'}
        >
          <Sparkles size={10} />
        </button>

        <button
          className={`island-icon-btn ${clickThrough ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleClickThrough();
          }}
          title={clickThrough ? 'Click-Through: ON (Ctrl+Shift+X to disable)' : 'Click-Through: OFF'}
        >
          {clickThrough ? <EyeOff size={10} /> : <Eye size={10} />}
        </button>

        <button
          className="island-icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggleMode('widget');
          }}
          title="Switch to Floating Widget"
        >
          <LayoutTemplate size={10} />
        </button>

        <button
          className="island-icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSearch();
          }}
          title="Search Lyrics"
        >
          <Search size={10} />
        </button>

        <button
          className="island-icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSettings();
          }}
          title="Settings"
        >
          <Settings size={10} />
        </button>

        <button
          className="island-icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            onMinimize();
          }}
          title="Hide to Tray"
        >
          <Minus size={10} />
        </button>

        <button
          className="island-icon-btn danger"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Close to Tray"
        >
          <X size={10} />
        </button>
      </div>
    </div>
  );
};
