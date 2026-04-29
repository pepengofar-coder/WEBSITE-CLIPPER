/**
 * API Client for Zenira Backend
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Trigger browser download from a URL.
 */
export function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'Zenira-output.mp4';
  a.style.display = 'none';
  document.body.appendChild(a);
  requestAnimationFrame(() => {
    a.click();
    setTimeout(() => {
      if (a.parentNode) document.body.removeChild(a);
    }, 5000);
  });
}
