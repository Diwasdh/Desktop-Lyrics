import React, { useState } from 'react';
import { X, Search, Music, Check } from 'lucide-react';
import { LyricsData } from '../types';
import { searchManualLyrics } from '../services/lyricsService';

interface ManualSearchModalProps {
  initialQuery: string;
  onSelectLyrics: (lyrics: LyricsData) => void;
  onClose: () => void;
}

export const ManualSearchModal: React.FC<ManualSearchModalProps> = ({
  initialQuery,
  onSelectLyrics,
  onClose,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<LyricsData[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const items = await searchManualLyrics(query.trim());
      setResults(items);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop interactive-btn" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={18} />
            <span>Search & Fix Lyrics</span>
          </div>
          <button className="icon-btn danger" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            className="search-input"
            placeholder="Type song title or artist..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            type="submit"
            className="icon-btn active"
            style={{ padding: '0 16px', borderRadius: 10 }}
            disabled={loading}
          >
            {loading ? '...' : <Search size={14} />}
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
          {results.length === 0 && !loading && (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '16px 0', fontSize: 13 }}>
              Search millions of synchronized lyrics on LRCLIB
            </div>
          )}

          {results.map((item) => (
            <div
              key={item.id || item.trackName}
              className="search-result-item"
              onClick={() => {
                onSelectLyrics(item);
                onClose();
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.trackName}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
                  {item.artistName} {item.albumName ? `• ${item.albumName}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {item.isSynced && (
                  <span
                    style={{
                      fontSize: 10,
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                  >
                    SYNCED
                  </span>
                )}
                <Check size={14} color="#60a5fa" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
