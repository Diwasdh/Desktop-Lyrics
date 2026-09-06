import React from 'react';
import { X, Palette, Type, Sliders, AlignCenter, AlignLeft } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  onClose: () => void;
}

const THEMES = [
  { id: 'deep-space', label: 'Deep Glass' },
  { id: 'aurora', label: 'Neon Aurora' },
  { id: 'cyberpunk', label: 'Cyberpunk' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'oled', label: 'OLED Black' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="modal-backdrop interactive-btn" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={18} />
            <span>Appearance & Settings</span>
          </div>
          <button className="icon-btn danger" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Themes */}
        <div>
          <div className="setting-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Palette size={14} />
            <span>Theme Preset</span>
          </div>
          <div className="theme-options">
            {THEMES.map((theme) => (
              <div
                key={theme.id}
                className={`theme-pill ${settings.theme === theme.id ? 'selected' : ''}`}
                onClick={() => onUpdateSettings({ theme: theme.id })}
              >
                {theme.label}
              </div>
            ))}
          </div>
        </div>

        {/* Opacity Slider */}
        <div className="setting-row">
          <div className="setting-label">
            Window Opacity: {Math.round(settings.opacity * 100)}%
          </div>
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={settings.opacity}
            onChange={(e) => onUpdateSettings({ opacity: parseFloat(e.target.value) })}
            style={{ width: '120px', cursor: 'pointer' }}
          />
        </div>

        {/* Font Size */}
        <div className="setting-row">
          <div className="setting-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Type size={14} />
            <span>Lyric Font Size</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['small', 'medium', 'large', 'huge'] as const).map((sz) => (
              <button
                key={sz}
                className={`icon-btn ${settings.fontSize === sz ? 'active' : ''}`}
                style={{ padding: '4px 8px', fontSize: 11, textTransform: 'capitalize' }}
                onClick={() => onUpdateSettings({ fontSize: sz })}
              >
                {sz[0].toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Lyric Alignment */}
        <div className="setting-row">
          <div className="setting-label">Text Alignment</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`icon-btn ${settings.alignment === 'left' ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ alignment: 'left' })}
              title="Left Align"
            >
              <AlignLeft size={14} />
            </button>
            <button
              className={`icon-btn ${settings.alignment === 'center' ? 'active' : ''}`}
              onClick={() => onUpdateSettings({ alignment: 'center' })}
              title="Center Align"
            >
              <AlignCenter size={14} />
            </button>
          </div>
        </div>

        {/* Click-Through Notice */}
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
          💡 <strong>Click-Through (Ghost Mode):</strong> Enable the eye icon in the titlebar or tray menu to allow clicks to pass through directly to your desktop, games, or apps beneath the lyrics.
        </div>
      </div>
    </div>
  );
};
