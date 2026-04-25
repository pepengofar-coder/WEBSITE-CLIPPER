/**
 * Platform detection and URL normalization for ClipForge backend.
 */

const PLATFORM_PATTERNS = [
  { name: 'youtube',   regex: /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i, icon: '▶️' },
  { name: 'tiktok',    regex: /(?:tiktok\.com|vm\.tiktok\.com)/i,                 icon: '🎵' },
  { name: 'instagram', regex: /(?:instagram\.com|instagr\.am)/i,                  icon: '📸' },
  { name: 'facebook',  regex: /(?:facebook\.com|fb\.watch|fb\.com)/i,             icon: '👤' },
  { name: 'twitter',   regex: /(?:x\.com|twitter\.com)/i,                         icon: '🐦' },
  { name: 'vimeo',     regex: /vimeo\.com/i,                                      icon: '🎬' },
  { name: 'twitch',    regex: /(?:twitch\.tv|clips\.twitch\.tv)/i,                icon: '🎮' },
];

/**
 * Detect the platform from a URL.
 * @param {string} url
 * @returns {{ name: string, icon: string } | null}
 */
export function detectPlatform(url) {
  if (!url) return null;
  for (const p of PLATFORM_PATTERNS) {
    if (p.regex.test(url)) return { name: p.name, icon: p.icon };
  }
  return null;
}

/**
 * Check if a URL looks valid.
 */
export function isValidUrl(url) {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
}

/**
 * List of all supported platform names (for error messages).
 */
export const SUPPORTED_PLATFORMS = PLATFORM_PATTERNS.map(p => p.name);
