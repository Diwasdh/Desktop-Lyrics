import React from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { LyricLine, MediaState } from '../types';

interface CompactBarProps {
  media: MediaState;
  lines: LyricLine[];
  activeLineIndex: number;
  onCommand: (cmd: 'play' | 'pause' | 'toggle' | 'next' | 'previous') => void;
  onExpand: () => void;
}

export const CompactBar: React.FC<CompactBarProps> = ({
  media,
  lines,
  activeLineIndex,
  onCommand,
  onExpand,
}) => {
  const currentLine = lines[activeLineIndex]?.text || (media.title ? '♪ ... ♪' : 'Ready');

  return (
    <div className="compact-view">
      {/* Thumbnail on the Left */}
      <div className="compact-art-wrap interactive-btn" onClick={onExpand} style={{ cursor: 'pointer' }}>
        {media.thumbnail ? (
          <img src={media.thumbnail} alt="Art" className="compact-art" />
        ) : (
          <img src="./logo_icon.svg" alt="App Logo" className="compact-art" />
        )}
      </div>

      {/* Lyrics Always in Exact Center */}
      <div className="compact-lyrics-wrap interactive-btn" onClick={onExpand} style={{ cursor: 'pointer' }}>
        <div className="compact-line">{currentLine}</div>
      </div>

      {/* Play/Pause Button Always on the Right */}
      <div className="compact-controls interactive-btn">
        <button
          className="ctrl-btn play-btn"
          style={{ padding: 6 }}
          onClick={() => onCommand('toggle')}
          title={media.status === 'Playing' ? 'Pause' : 'Play'}
        >
          {media.status === 'Playing' ? <Pause size={13} /> : <Play size={13} />}
        </button>
      </div>
    </div>
  );
};
