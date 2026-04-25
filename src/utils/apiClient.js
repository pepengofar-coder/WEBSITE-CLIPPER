/**
 * API Client for ClipForge Backend
 *
 * Connects the React frontend to the Express backend for:
 * - URL validation (yt-dlp metadata)
 * - MP4 export (server-side download + ffmpeg)
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Check if the backend server is reachable.
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

/**
 * Validate a video URL and get metadata from the backend.
 *
 * @param {string} sourceUrl - URL to check
 * @returns {Promise<object>} - { ok, isSupported, platform, title, duration, thumbnail, ... }
 */
export async function checkUrl(sourceUrl) {
  const res = await fetch(`${BACKEND_URL}/api/check-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceUrl }),
    signal: AbortSignal.timeout(90_000), // 90s timeout for slow lookups
  });

  const data = await res.json();

  if (!res.ok && !data.error) {
    throw new Error('Server error. Silakan coba lagi.');
  }

  return data;
}

/**
 * Request the backend to export a video clip as MP4.
 *
 * @param {object} params
 * @param {string} params.sourceUrl - Original video URL
 * @param {string} params.title - Clip title (for filename)
 * @param {number} params.startTime - Start timestamp in seconds
 * @param {number} params.endTime - End timestamp in seconds
 * @param {string} params.quality - '720p' or '1080p'
 * @param {boolean} params.withSubtitles - Include subtitles
 * @returns {Promise<object>} - { ok, filename, size, downloadUrl }
 */
export async function exportMp4({ sourceUrl, title, startTime, endTime, quality = '720p', withSubtitles = false }) {
  const res = await fetch(`${BACKEND_URL}/api/export-mp4`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceUrl, title, startTime, endTime, quality, withSubtitles }),
    signal: AbortSignal.timeout(300_000), // 5 min timeout for video processing
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data.error || 'Gagal mengekspor video.');
  }

  return data;
}

/**
 * Trigger browser download from a URL.
 */
export function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'clipforge-output.mp4';
  a.style.display = 'none';
  document.body.appendChild(a);
  requestAnimationFrame(() => {
    a.click();
    setTimeout(() => {
      if (a.parentNode) document.body.removeChild(a);
    }, 5000);
  });
}
