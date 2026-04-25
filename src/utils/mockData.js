// Data dan utilitas untuk ClipForge (Bahasa Indonesia)

export const PROCESSING_STEPS = [
  { id: 1, label: 'Mengunduh audio', icon: '📥' },
  { id: 2, label: 'Transkripsi suara', icon: '🎙️' },
  { id: 3, label: 'Mendeteksi momen viral', icon: '🔍' },
  { id: 4, label: 'Membuat klip', icon: '✂️' },
];

export const VIRAL_QUOTES = [
  "Hook terbaik terjadi di 3 detik pertama klip.",
  "Konten pendek mendapat 2.5x lebih banyak interaksi.",
  "Klip dengan caption mendapat 80% lebih banyak views.",
  "Durasi klip viral ideal antara 15-45 detik.",
  "Puncak emosional menghasilkan 3x lebih banyak share.",
  "Video vertikal (9:16) mendapat 58% lebih banyak engagement.",
];

export const CAPTION_STYLES = [
  {
    id: 'bold-pop',
    name: 'Bold Pop',
    description: 'Teks tebal berwarna dengan animasi pop-up',
    preview: 'Aa',
    color: '#ff6b35',
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    description: 'Caption gaya neon bercahaya',
    preview: 'Aa',
    color: '#00ff88',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Teks putih bersih dengan bayangan halus',
    preview: 'Aa',
    color: '#ffffff',
  },
];

export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimestamp(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getViralLevel(score) {
  if (score >= 80) return { emoji: '🔥', label: 'Viral', tier: 'fire' };
  if (score >= 60) return { emoji: '⚡', label: 'Panas', tier: 'hot' };
  return { emoji: '💡', label: 'Potensial', tier: 'warm' };
}

export function detectPlatform(url) {
  if (!url) return null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('tiktok.com') || url.includes('vm.tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('vimeo.com')) return 'vimeo';
  if (url.includes('twitch.tv') || url.includes('clips.twitch.tv')) return 'twitch';
  if (url.includes('dailymotion.com') || url.includes('dai.ly')) return 'dailymotion';
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('podcasts.apple.com')) return 'apple-podcast';
  if (url.includes('anchor.fm') || url.includes('spotify.com/episode')) return 'podcast';
  return 'generic';
}
