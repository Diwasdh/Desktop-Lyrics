import { LyricLine, LyricsData } from '../types';
import { parseLrc, parsePlainLyrics } from '../utils/lrcParser';

interface CleanMetadata {
  cleanArtist: string;
  cleanTitle: string;
}

export function cleanTrackInfo(rawTitle: string, rawArtist: string): CleanMetadata {
  let title = rawTitle || '';
  let artist = rawArtist || '';

  // Common YouTube & streaming suffixes to remove
  const noisePatterns = [
    /\s*\[\s*(official\s*(music\s*)?video|official\s*audio|lyrics?|visualizer|audio|4k|hd|remastered?)\s*\]/gi,
    /\s*\(\s*(official\s*(music\s*)?video|official\s*audio|lyrics?|visualizer|audio|4k|hd|remastered?)\s*\)/gi,
    /\s*\|\s*official\s*(music\s*)?video/gi,
    /\s*-\s*official\s*(music\s*)?video/gi,
    /\s*\[\s*lyrics?\s*video\s*\]/gi,
    /\s*\(\s*lyrics?\s*video\s*\)/gi,
    /\s*\(?(ft\.|feat\.|featuring)\s+[^()\[\]]+\)?/gi,
    /\s*-\s*remaster(ed)?(\s*\d{4})?/gi,
    /\s*\(\s*\d{4}\s*remaster(ed)?\s*\)/gi,
    /\s*\(live(\s+at\s+[^)]+)?\)/gi,
  ];

  for (const pattern of noisePatterns) {
    title = title.replace(pattern, '');
  }

  // Handle "Artist - Track" in Title (frequent in YouTube/VLC)
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    if (parts.length >= 2) {
      const candidateArtist = parts[0].trim();
      const candidateTitle = parts.slice(1).join(' - ').trim();

      // If rawArtist is generic (like "YouTube", "Chrome", or "ArtistVEVO")
      const isGenericArtist =
        !artist ||
        artist.toLowerCase().includes('vevo') ||
        artist.toLowerCase().includes('youtube') ||
        artist.toLowerCase().includes('topic');

      if (isGenericArtist || artist.toLowerCase() === candidateArtist.toLowerCase()) {
        artist = candidateArtist;
        title = candidateTitle;
      }
    }
  }

  // Clean artist "VEVO" or "- Topic"
  artist = artist.replace(/vevo$/i, '').replace(/\s*-\s*topic$/i, '').trim();

  return {
    cleanArtist: artist.trim(),
    cleanTitle: title.trim(),
  };
}

const LYRICS_CACHE_KEY_PREFIX = 'desktop_lyrics_cache_';

export async function fetchLyrics(
  title: string,
  artist: string,
  durationSecs?: number
): Promise<LyricsData | null> {
  const { cleanArtist, cleanTitle } = cleanTrackInfo(title, artist);

  if (!cleanTitle) return null;

  // Check LocalStorage Cache
  const cacheKey = `${LYRICS_CACHE_KEY_PREFIX}${cleanArtist.toLowerCase()}_${cleanTitle.toLowerCase()}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed: LyricsData = JSON.parse(cached);
      return parsed;
    }
  } catch (e) {
    // ignore cache read error
  }

  // Attempt 1: Exact Match on LRCLIB
  try {
    const params = new URLSearchParams();
    if (cleanArtist) params.append('artist_name', cleanArtist);
    params.append('track_name', cleanTitle);
    if (durationSecs && durationSecs > 10) {
      params.append('duration', Math.round(durationSecs).toString());
    }

    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.syncedLyrics || data.plainLyrics)) {
        const result = formatLyricsResponse(data, cleanTitle, cleanArtist);
        saveToCache(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('LRCLIB exact get error:', err);
  }

  // Attempt 2: Search LRCLIB
  try {
    const query = cleanArtist ? `${cleanArtist} ${cleanTitle}` : cleanTitle;
    const searchRes = await fetch(
      `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`
    );
    if (searchRes.ok) {
      const items = await searchRes.json();
      if (Array.isArray(items) && items.length > 0) {
        // Prioritize items with syncedLyrics
        const bestItem = items.find((it: any) => it.syncedLyrics) || items[0];
        if (bestItem && (bestItem.syncedLyrics || bestItem.plainLyrics)) {
          const result = formatLyricsResponse(bestItem, cleanTitle, cleanArtist);
          saveToCache(cacheKey, result);
          return result;
        }
      }
    }
  } catch (err) {
    console.warn('LRCLIB search error:', err);
  }

  return null;
}

export async function searchManualLyrics(query: string): Promise<LyricsData[]> {
  try {
    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items)) {
        return items.map((item) => formatLyricsResponse(item, item.trackName, item.artistName));
      }
    }
  } catch (err) {
    console.error('Manual search error:', err);
  }
  return [];
}

function formatLyricsResponse(raw: any, defaultTitle: string, defaultArtist: string): LyricsData {
  const hasSynced = !!raw.syncedLyrics && raw.syncedLyrics.trim().length > 0;
  let lines: LyricLine[] = [];

  if (hasSynced) {
    lines = parseLrc(raw.syncedLyrics);
  } else if (raw.plainLyrics) {
    lines = parsePlainLyrics(raw.plainLyrics);
  }

  return {
    id: raw.id,
    trackName: raw.trackName || defaultTitle,
    artistName: raw.artistName || defaultArtist,
    albumName: raw.albumName,
    duration: raw.duration,
    syncedLyrics: raw.syncedLyrics,
    plainLyrics: raw.plainLyrics,
    lines,
    isSynced: hasSynced,
  };
}

function saveToCache(key: string, data: LyricsData) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // LocalStorage full or private browsing
  }
}
