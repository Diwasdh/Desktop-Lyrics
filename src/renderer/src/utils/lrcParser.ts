import { LyricLine } from '../types';

export function parseLrc(lrcText: string): LyricLine[] {
  if (!lrcText || typeof lrcText !== 'string') return [];

  const lines = lrcText.split(/\r?\n/);
  const timeRegex = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
  const parsedLines: { timeMs: number; text: string }[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check if line has any timestamp
    const matches = Array.from(trimmed.matchAll(timeRegex));
    if (matches.length === 0) continue;

    const cleanText = trimmed.replace(timeRegex, '').trim();

    for (const match of matches) {
      const minutes = parseInt(match[1], 10) || 0;
      const seconds = parseInt(match[2], 10) || 0;
      let ms = 0;
      if (match[3]) {
        if (match[3].length === 2) {
          ms = parseInt(match[3], 10) * 10;
        } else {
          ms = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
        }
      }

      const totalMs = minutes * 60 * 1000 + seconds * 1000 + ms;
      parsedLines.push({ timeMs: totalMs, text: cleanText });
    }
  }

  // Sort by time
  parsedLines.sort((a, b) => a.timeMs - b.timeMs);

  // Insert subtle instrumental gap markers if gap > 8000ms
  const result: LyricLine[] = [];
  let idCounter = 0;

  for (let i = 0; i < parsedLines.length; i++) {
    const curr = parsedLines[i];
    const prev = result[result.length - 1];

    if (i === 0 && curr.timeMs > 9000) {
      // Intro instrumental
      result.push({
        id: idCounter++,
        timeMs: 1000,
        text: '♪ ♫  Music Intro  ♫ ♪',
        isInstrumental: true,
      });
    } else if (prev && curr.timeMs - prev.timeMs > 12000) {
      // Mid-song instrumental break
      result.push({
        id: idCounter++,
        timeMs: prev.timeMs + 3000,
        text: '♪ ♫  Instrumental  ♫ ♪',
        isInstrumental: true,
      });
    }

    result.push({
      id: idCounter++,
      timeMs: curr.timeMs,
      text: curr.text || '...',
      isInstrumental: !curr.text,
    });
  }

  return result;
}

export function parsePlainLyrics(plainText: string): LyricLine[] {
  if (!plainText) return [];
  const lines = plainText.split(/\r?\n/);
  return lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((text, idx) => ({
      id: idx,
      timeMs: idx * 4000, // estimated
      text,
      isInstrumental: false,
    }));
}

export function findActiveLyricIndex(lines: LyricLine[], currentTimeMs: number): number {
  if (!lines || lines.length === 0) return -1;
  if (currentTimeMs < lines[0].timeMs) return 0;

  for (let i = lines.length - 1; i >= 0; i--) {
    if (currentTimeMs >= lines[i].timeMs) {
      return i;
    }
  }

  return 0;
}
