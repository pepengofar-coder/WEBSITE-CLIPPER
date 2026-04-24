// Mock data for frontend demo
export const MOCK_CLIPS = [
  {
    id: 'clip-1',
    title: 'AI Will Replace Everything',
    topic: 'Artificial Intelligence',
    viralScore: 95,
    duration: 42,
    startTime: 723, // 12:03 in seconds
    endTime: 765,   // 12:45
    captionStyle: 'bold-pop',
    thumbnail: null,
    transcript: "This is going to change everything. AI isn't just a tool anymore, it's becoming a collaborator. In five years, every creative process will have AI integrated...",
  },
  {
    id: 'clip-2',
    title: 'Neuralink First Results',
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
    title: 'Mars Colony Timeline',
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
    title: 'Why Social Media is Broken',
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
    title: 'The Future of Education',
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
  totalDuration: 10800, // 3 hours
};

export const PROCESSING_STEPS = [
  { id: 1, label: 'Downloading audio', icon: '📥' },
  { id: 2, label: 'Transcribing speech', icon: '🎙️' },
  { id: 3, label: 'Detecting viral moments', icon: '🔍' },
  { id: 4, label: 'Generating clips', icon: '✂️' },
];

export const VIRAL_QUOTES = [
  "The best hooks happen in the first 3 seconds of a clip.",
  "Short-form content gets 2.5x more engagement than long-form.",
  "Clips with captions get 80% more views than those without.",
  "The ideal viral clip length is between 15-45 seconds.",
  "Emotional peaks drive 3x more shares than flat content.",
  "Vertical video (9:16) gets 58% more engagement on mobile.",
];

export const CAPTION_STYLES = [
  {
    id: 'bold-pop',
    name: 'Bold Pop',
    description: 'Bold, colorful text with pop-up animation',
    preview: 'Aa',
    color: '#ff6b35',
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    description: 'Glowing neon-style captions',
    preview: 'Aa',
    color: '#00ff88',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, white text with subtle shadow',
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
  if (score >= 80) return { emoji: '🔥', label: 'Fire', tier: 'fire' };
  if (score >= 60) return { emoji: '⚡', label: 'Hot', tier: 'hot' };
  return { emoji: '💡', label: 'Potential', tier: 'warm' };
}

export function detectPlatform(url) {
  if (!url) return null;
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('podcasts.apple.com')) return 'apple-podcast';
  if (url.includes('anchor.fm') || url.includes('spotify.com/episode')) return 'podcast';
  return 'generic';
}
