// Data dan utilitas untuk ClipForge (Bahasa Indonesia)
export const MOCK_CLIPS = [
  {
    id: 'clip-1',
    title: 'AI Akan Menggantikan Segalanya',
    topic: 'Artificial Intelligence',
    viralScore: 95,
    duration: 42,
    startTime: 723,
    endTime: 765,
    captionStyle: 'bold-pop',
    thumbnail: null,
    transcript: "This is going to change everything. AI isn't just a tool anymore, it's becoming a collaborator. In five years, every creative process will have AI integrated...",
  },
  {
    id: 'clip-2',
    title: 'Hasil Pertama Neuralink',
    topic: 'Technology',
    viralScore: 87,
    duration: 31,
    startTime: 1845,
    endTime: 1876,
    captionStyle: 'bold-pop',
    thumbnail: null,
    transcript: "The first patient with Neuralink can now control a cursor just by thinking. That's not science fiction anymore, that's literally happening right now...",
  },
  {
    id: 'clip-3',
    title: 'Timeline Koloni Mars',
    topic: 'Space',
    viralScore: 72,
    duration: 55,
    startTime: 3200,
    endTime: 3255,
    captionStyle: 'neon-glow',
    thumbnail: null,
    transcript: "We're looking at 2030 for the first unmanned landing, and by 2035, we could have a small habitat. The biggest challenge isn't the rocket, it's keeping humans alive...",
  },
  {
    id: 'clip-4',
    title: 'Kenapa Media Sosial Rusak',
    topic: 'Society',
    viralScore: 68,
    duration: 38,
    startTime: 4500,
    endTime: 4538,
    captionStyle: 'minimal',
    thumbnail: null,
    transcript: "The algorithm doesn't care about truth, it cares about engagement. And what gets engagement? Outrage, fear, and controversy. That's the fundamental problem...",
  },
  {
    id: 'clip-5',
    title: 'Masa Depan Pendidikan',
    topic: 'Education',
    viralScore: 61,
    duration: 47,
    startTime: 5800,
    endTime: 5847,
    captionStyle: 'bold-pop',
    thumbnail: null,
    transcript: "Sitting in a classroom for 8 hours is an industrial-age concept. The future is personalized AI tutors that adapt to how each student learns best...",
  },
];

export const MOCK_SOURCE = {
  title: 'Joe Rogan Experience #2103 — Elon Musk',
  platform: 'youtube',
  url: 'https://www.youtube.com/watch?v=example123',
  totalDuration: 10800,
};

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
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('podcasts.apple.com')) return 'apple-podcast';
  if (url.includes('anchor.fm') || url.includes('spotify.com/episode')) return 'podcast';
  return 'generic';
}
