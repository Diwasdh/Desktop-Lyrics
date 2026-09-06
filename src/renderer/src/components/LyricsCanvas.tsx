import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music } from 'lucide-react';
import { LyricLine, MediaState } from '../types';

interface LyricsCanvasProps {
  media: MediaState;
  currentTimeMs: number;
  lines: LyricLine[];
  activeLineIndex: number;
  isSynced: boolean;
  alignment: 'center' | 'left';
  fontSize: 'small' | 'medium' | 'large' | 'huge';
  onCommand: (cmd: 'play' | 'pause' | 'toggle' | 'next' | 'previous') => void;
  onLineClick?: (line: LyricLine) => void;
}

export const LyricsCanvas: React.FC<LyricsCanvasProps> = ({
  media,
  currentTimeMs,
  lines,
  activeLineIndex,
  isSynced,
  alignment,
  fontSize,
  onCommand,
  onLineClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<any>(null);

  // Smooth auto-scroll to center active line perfectly
  useEffect(() => {
    if (userIsScrolling || activeLineIndex < 0) return;

    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeLineRef.current;

      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      // Relative pixel offset from container viewport to active element
      const relativeTop = elementRect.top - containerRect.top;
      const targetScroll =
        container.scrollTop + relativeTop - container.clientHeight / 2 + element.clientHeight / 2;

      container.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth',
      });
    }
  }, [activeLineIndex, userIsScrolling]);

  const handleScroll = () => {
    setUserIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setUserIsScrolling(false);
    }, 3500);
  };

  const formatTime = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent =
    media.durationMs > 0 ? Math.min(100, (currentTimeMs / media.durationMs) * 100) : 0;

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'small': return { active: '20px', inactive: '15px' };
      case 'large': return { active: '30px', inactive: '22px' };
      case 'huge': return { active: '36px', inactive: '26px' };
      default: return { active: '25px', inactive: '18px' };
    }
  };

  const sizes = getFontSizeClass();

  return (
    <div className="canvas-view">
      {/* Track Header */}
      <div className="canvas-header">
        {media.thumbnail ? (
          <img src={media.thumbnail} alt="Album Art" className="canvas-art" />
        ) : (
          <img src="./logo_icon.svg" alt="App Logo" className="canvas-art" />
        )}
        <div className="canvas-meta">
          <div className="canvas-title">{media.title || 'No song playing'}</div>
          <div className="canvas-artist">
            {media.artist ? `${media.artist} ${media.album ? `• ${media.album}` : ''}` : 'Play music in Spotify, Chrome, etc.'}
          </div>
        </div>
      </div>

      {/* Kinetic Scrolling Lyric Container */}
      <div
        className="lyrics-scroll-container"
        ref={containerRef}
        onWheel={handleScroll}
        onTouchMove={handleScroll}
      >
        {lines.length === 0 ? (
          <div className="empty-state">
            <Music size={40} color="rgba(255,255,255,0.3)" />
            <h3>No Lyrics Found</h3>
            <p>
              Play a track anywhere on your PC, or click the search icon above to look up lyrics manually.
            </p>
          </div>
        ) : (
          lines.map((line, index) => {
            const isActive = index === activeLineIndex;
            const isPassed = index < activeLineIndex;
            const isUpcoming = index > activeLineIndex;

            return (
              <div
                key={line.id}
                ref={isActive ? activeLineRef : null}
                className={`lyric-item interactive-btn ${alignment} ${
                  isActive ? 'active' : isPassed ? 'passed' : 'upcoming'
                } ${line.isInstrumental ? 'instrumental' : ''}`}
                style={{
                  fontSize: isActive ? sizes.active : sizes.inactive,
                  textAlign: alignment,
                }}
                onClick={() => onLineClick?.(line)}
              >
                {line.text}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Player & Progress Bar */}
      <div className="player-controls-bar">
        <div className="playback-btns">
          <button className="ctrl-btn" onClick={() => onCommand('previous')} title="Previous">
            <SkipBack size={16} />
          </button>
          <button
            className="ctrl-btn play-btn"
            onClick={() => onCommand('toggle')}
            title={media.status === 'Playing' ? 'Pause' : 'Play'}
          >
            {media.status === 'Playing' ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button className="ctrl-btn" onClick={() => onCommand('next')} title="Next">
            <SkipForward size={16} />
          </button>
        </div>

        <div className="progress-wrap">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="progress-times">
            <span>{formatTime(currentTimeMs)}</span>
            <span>{formatTime(media.durationMs)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
