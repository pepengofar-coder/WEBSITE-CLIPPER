/**
 * Thumbnail Generator for YouKlip
 * Creates FYP-ready 1080×1920 thumbnails using Canvas API.
 */

const GRADIENT_PRESETS = [
  ['#7c3aed', '#ec4899'],
  ['#3b82f6', '#10b981'],
  ['#f59e0b', '#ef4444'],
  ['#06b6d4', '#8b5cf6'],
  ['#ec4899', '#f97316'],
];

/**
 * Generate a viral-ready thumbnail for a clip.
 * @param {Object} clip - Clip data (title, topic, viralScore, transcript)
 * @returns {Promise<Blob>} PNG blob
 */
export async function generateThumbnail(clip) {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Pick gradient based on clip id
  const hash = Math.abs(hashStr(clip.id || clip.title || ''));
  const colors = GRADIENT_PRESETS[hash % GRADIENT_PRESETS.length];

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Dark overlay for text readability
  const overlay = ctx.createLinearGradient(0, 0, 0, H);
  overlay.addColorStop(0, 'rgba(0,0,0,0.2)');
  overlay.addColorStop(0.5, 'rgba(0,0,0,0.4)');
  overlay.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, W, H);

  // Decorative circles
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(W * 0.8, H * 0.15, 300, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W * 0.2, H * 0.75, 250, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Viral score badge (top right)
  const score = clip.viralScore || 75;
  const badgeX = W - 180;
  const badgeY = 100;
  ctx.fillStyle = score >= 80 ? 'rgba(255,107,53,0.9)' : score >= 60 ? 'rgba(245,158,11,0.9)' : 'rgba(59,130,246,0.9)';
  roundRect(ctx, badgeX, badgeY, 140, 56, 28);
  ctx.fill();
  ctx.font = 'bold 28px "Inter", sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(`🔥 ${score}%`, badgeX + 70, badgeY + 38);

  // Topic badge (top left)
  ctx.font = '600 26px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  const topicText = clip.topic || 'Viral';
  const topicW = ctx.measureText(topicText).width + 40;
  roundRect(ctx, 50, 100, topicW, 50, 25);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.fillText(topicText, 70, 134);

  // Main title (center)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 72px "Inter", sans-serif';
  const title = clip.title || 'Momen Viral';
  wrapText(ctx, title, W / 2, H * 0.38, W - 140, 88);

  // Transcript preview (middle)
  ctx.font = '400 32px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const preview = `"${(clip.transcript || '').substring(0, 100)}..."`;
  wrapText(ctx, preview, W / 2, H * 0.58, W - 160, 42);

  // Bottom branding bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, H - 200, W, 200);

  // YouKlip logo
  ctx.font = 'bold 36px "Inter", sans-serif';
  ctx.fillStyle = '#a78bfa';
  ctx.textAlign = 'center';
  ctx.fillText('🎬 YouKlip', W / 2, H - 130);

  // Hashtags
  ctx.font = '600 28px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('#fyp #viral #trending #youklip', W / 2, H - 80);

  // Duration badge (bottom left)
  if (clip.duration) {
    const mins = Math.floor(clip.duration / 60);
    const secs = clip.duration % 60;
    const durText = `${mins}:${secs.toString().padStart(2, '0')}`;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    roundRect(ctx, 50, H - 260, 120, 46, 23);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱ ${durText}`, 110, H - 230);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1);
  });
}

/**
 * Download a thumbnail blob
 */
export function downloadThumbnail(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'thumbnail_youklip.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Helpers ---
function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let dy = 0;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line !== '') {
      ctx.fillText(line.trim(), x, y + dy);
      line = word + ' ';
      dy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, y + dy);
}
