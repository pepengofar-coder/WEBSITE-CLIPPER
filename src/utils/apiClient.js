/**
 * API Client for YouKlip Backend
 *
 * Connects the React frontend to the Express backend for:
 * - URL validation (yt-dlp metadata)
 * - MP4 export (server-side download + ffmpeg)
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Check if the backend server is reachable.
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(5000) });
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
  const res = await fetch(`${API_BASE_URL}/api/check-url`, {
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
  console.log('[Export] API_BASE_URL:', API_BASE_URL);
  console.log('[Export] payload:', { sourceUrl, title, startTime, endTime, quality, withSubtitles });
  
  const isHealthy = await checkHealth();
  if (!isHealthy) {
    throw new Error('Backend server is not running. Start backend or configure VITE_API_BASE_URL.');
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/export-mp4`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl, title, startTime, endTime, quality, withSubtitles }),
      signal: AbortSignal.timeout(180_000), // 3 min timeout
    });

    const data = await res.json();
    console.log('[Export] server response:', data);

    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Export gagal');
    }

    if (!data.downloadUrl) {
      throw new Error('Download URL tidak diterima dari server');
    }

    console.log('[Export] downloadUrl:', data.downloadUrl);
    return data;
  } catch (err) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      throw new Error('Server terlalu lama memproses video. Coba clip yang lebih pendek atau kualitas 720p.');
    }
    throw err;
  }
}

/**
 * Trigger browser download from a URL.
 */
export function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'youklip-output.mp4';
  a.style.display = 'none';
  document.body.appendChild(a);
  requestAnimationFrame(() => {
    a.click();
    setTimeout(() => {
      if (a.parentNode) document.body.removeChild(a);
    }, 5000);
  });
}
