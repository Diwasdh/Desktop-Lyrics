import { exec } from 'child_process';
import { BrowserWindow } from 'electron';

export interface MacMediaTrack {
  app: string;
  title: string;
  artist: string;
  album: string;
  status: string;
  positionMs: number;
  durationMs: number;
  thumbnail: string;
}

export class MacMediaBridge {
  private timer: NodeJS.Timeout | null = null;
  private lastTrackKey = '';
  private lastStatus = '';
  private lastPositionMs = -1;
  private isChecking = false;
  private getMainWindow: () => BrowserWindow | null;

  constructor(getMainWindow: () => BrowserWindow | null) {
    this.getMainWindow = getMainWindow;
  }

  public start() {
    if (this.timer) return;
    console.log('[MacMediaBridge] Starting macOS media bridge...');
    // Initial check
    this.poll();
    // Poll every 350ms
    this.timer = setInterval(() => this.poll(), 350);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public sendCommand(cmd: string) {
    const command = cmd.toLowerCase().trim();
    let script = '';

    if (command === 'playpause' || command === 'toggle') {
      script = `
        if application "Spotify" is running then
          tell application "Spotify" to playpause
        else if application "Music" is running then
          tell application "Music" to playpause
        end if
      `;
    } else if (command === 'next') {
      script = `
        if application "Spotify" is running then
          tell application "Spotify" to next track
        else if application "Music" is running then
          tell application "Music" to next track
        end if
      `;
    } else if (command === 'previous' || command === 'prev') {
      script = `
        if application "Spotify" is running then
          tell application "Spotify" to previous track
        else if application "Music" is running then
          tell application "Music" to previous track
        end if
      `;
    } else if (command === 'play') {
      script = `
        if application "Spotify" is running then
          tell application "Spotify" to play
        else if application "Music" is running then
          tell application "Music" to play
        end if
      `;
    } else if (command === 'pause') {
      script = `
        if application "Spotify" is running then
          tell application "Spotify" to pause
        else if application "Music" is running then
          tell application "Music" to pause
        end if
      `;
    }

    if (script) {
      exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (err) => {
        if (err) console.error('[MacMediaBridge] Error executing command:', err);
      });
    }
  }

  private poll() {
    if (this.isChecking) return;
    this.isChecking = true;

    const script = `
      set res to ""
      if application "Spotify" is running then
        try
          tell application "Spotify"
            set sStatus to player state as string
            set sTrack to name of current track
            set sArtist to artist of current track
            set sAlbum to album of current track
            set sDur to (duration of current track) / 1000
            set sPos to player position
            set sArt to ""
            try
              set sArt to artwork url of current track
            end try
            set res to "Spotify|||" & sTrack & "|||" & sArtist & "|||" & sAlbum & "|||" & sStatus & "|||" & (sPos as string) & "|||" & (sDur as string) & "|||" & sArt
          end tell
        end try
      else if application "Music" is running then
        try
          tell application "Music"
            set mStatus to player state as string
            set mTrack to name of current track
            set mArtist to artist of current track
            set mAlbum to album of current track
            set mDur to duration of current track
            set mPos to player position
            set res to "Apple Music|||" & mTrack & "|||" & mArtist & "|||" & mAlbum & "|||" & mStatus & "|||" & (mPos as string) & "|||" & (mDur as string) & "|||"
          end tell
        end try
      end if
      return res
    `;

    exec(`osascript -e '${script.replace(/'/g, "'\\''")}'`, (error, stdout) => {
      this.isChecking = false;
      if (error) return;

      const output = stdout.trim();
      if (!output) {
        // Nothing playing or neither app open
        if (this.lastStatus !== 'Stopped' && this.lastTrackKey !== '') {
          this.lastStatus = 'Stopped';
          this.lastTrackKey = '';
          this.emitTick('Stopped', 0, 0);
        }
        return;
      }

      const parts = output.split('|||');
      if (parts.length < 7) return;

      const app = parts[0];
      const title = parts[1];
      const artist = parts[2];
      const album = parts[3];
      const rawStatus = parts[4].toLowerCase();
      const status = rawStatus === 'playing' ? 'Playing' : 'Paused';
      const posMs = Math.round(parseFloat(parts[5] || '0') * 1000);
      const durMs = Math.round(parseFloat(parts[6] || '0') * 1000);
      const thumbnail = parts[7] || '';

      const trackKey = `${app}|${title}|${artist}|${durMs}`;

      if (trackKey !== this.lastTrackKey) {
        this.lastTrackKey = trackKey;
        this.lastStatus = status;
        this.lastPositionMs = posMs;

        this.emitTrackChange({
          app,
          title,
          artist,
          album,
          status,
          positionMs: posMs,
          durationMs: durMs,
          thumbnail,
        });
      } else {
        const statusChanged = status !== this.lastStatus;
        const posMoved = Math.abs(posMs - this.lastPositionMs) >= 150;

        if (statusChanged || posMoved) {
          this.lastStatus = status;
          this.lastPositionMs = posMs;
          this.emitTick(status, posMs, durMs);
        }
      }
    });
  }

  private emitTrackChange(track: MacMediaTrack) {
    const win = this.getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('media:event', {
        type: 'track_change',
        data: track,
      });
    }
  }

  private emitTick(status: string, positionMs: number, durationMs: number) {
    const win = this.getMainWindow();
    if (win && !win.isDestroyed()) {
      win.webContents.send('media:event', {
        type: 'timeline_tick',
        data: {
          status,
          positionMs,
          durationMs,
        },
      });
    }
  }
}
