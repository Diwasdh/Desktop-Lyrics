import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Music } from 'lucide-react';
import { LyricLine, MediaState } from '../types';

interface FloatingWidgetProps {
  media: MediaState;
  currentTimeMs: number;
  lines: LyricLine[];
  activeLineIndex: number;
  onCommand: (cmd: 'play' | 'pause' | 'toggle' | 'next' | 'previous') => void;
  onExpand: () => void;
}

export const FloatingWidget: React.FC<FloatingWidgetProps> = ({
  media,
  currentTimeMs,
  lines,
  activeLineIndex,
  onCommand,
  onExpand,
}) => {
  const currentLine = lines[activeLineIndex]?.text || (media.title ? '♪ ... ♪' : 'No track playing');
  const nextLine = lines[activeLineIndex + 1]?.text || '';

  const progressPercent =
    media.durationMs > 0 ? Math.min(100, (currentTimeMs / media.durationMs) * 100) : 0;

  return (
    <div className="widget-view">
      {/* Album Art with click to expand */}
      <div className="widget-art-wrap interactive-btn" onClick={onExpand} title="Click to view full lyrics">
        {media.thumbnail ? (
          <img src={media.thumbnail} alt="Album Art" className="widget-art" />
        ) : (
          <img src="./logo_icon.svg" alt="App Logo" className="widget-art" />
        )}
      </div>

      {/* Lyrics & Track Info */}
      <div className="widget-lyrics-column">
        <div className="widget-track-info">
          <span className="widget-track-title">{media.title || 'Ready'}</span>
          {media.artist && <span className="widget-track-artist">• {media.artist}</span>}
        </div>

        <div className="widget-current-line" onClick={onExpand} style={{ cursor: 'pointer' }}>
          {currentLine}
        </div>

        {nextLine && <div className="widget-next-line">{nextLine}</div>}

        {/* Mini progress bar */}
        {media.durationMs > 0 && (
          <div className="progress-track" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        )}
      </div>

      {/* Quick Media Controls */}
      <div className="playback-btns interactive-btn" style={{ flexDirection: 'column', gap: 6 }}>
        <button
          className="ctrl-btn play-btn"
          onClick={() => onCommand('toggle')}
          title={media.status === 'Playing' ? 'Pause' : 'Play'}
        >
          {media.status === 'Playing' ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="ctrl-btn" onClick={() => onCommand('previous')} title="Previous">
            <SkipBack size={12} />
          </button>
          <button className="ctrl-btn" onClick={() => onCommand('next')} title="Next">
            <SkipForward size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};
