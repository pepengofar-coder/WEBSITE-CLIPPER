/**
 * Viral Metadata Generator for ClipForge
 * Generates FYP-ready titles, descriptions, and hashtags in Indonesian.
 */

const TOPIC_HASHTAGS = {
  'Artificial Intelligence': ['#ai', '#kecerdasanbuatan', '#teknologi', '#masa depan', '#robot'],
  'Technology': ['#teknologi', '#inovasi', '#gadget', '#digital', '#startup'],
  'Space': ['#luar angkasa', '#mars', '#nasa', '#astronomi', '#sains'],
  'Society': ['#sosial', '#mediasosial', '#budaya', '#opini', '#trending'],
  'Education': ['#pendidikan', '#belajar', '#sekolah', '#edukasi', '#ilmu'],
  'Science': ['#sains', '#penelitian', '#penemuan', '#fakta', '#ilmupengetahuan'],
  'Health': ['#kesehatan', '#sehat', '#tips', '#medis', '#gaya hidup'],
  'Business': ['#bisnis', '#investasi', '#uang', '#sukses', '#entrepreneur'],
  'Entertainment': ['#hiburan', '#film', '#musik', '#selebriti', '#trending'],
  'Sports': ['#olahraga', '#sepakbola', '#fitness', '#atlet', '#kompetisi'],
  'Religion': ['#islam', '#dakwah', '#kajian', '#quran', '#sunnah'],
  'Islamic': ['#islam', '#dakwah', '#ceramah', '#ustadz', '#hijrah'],
};

const BASE_FYP_HASHTAGS = ['#fyp', '#viral', '#foryou', '#foryoupage', '#trending', '#clipforge'];

const HOOK_TEMPLATES_ID = [
  '🔥 Ini yang jarang orang tahu!',
  '😱 Fakta mengejutkan yang harus kamu dengar!',
  '💡 Penjelasan terbaik tentang {topic}',
  '🚀 {topic} di masa depan, kamu siap?',
  '⚡ Wajib tonton sampai habis!',
  '🧠 Otak kamu akan meledak setelah dengar ini',
  '🎯 Langsung ke intinya tentang {topic}',
  '👀 Kebanyakan orang belum tahu ini...',
];

const DESC_TEMPLATES_ID = [
  'Potongan momen viral dari video lengkap. {topic} dijelaskan dengan cara yang gampang dipahami! Jangan lupa share ke teman kamu 🔥',
  'Clip pendek tapi penuh insight tentang {topic}. Simpan video ini biar nggak hilang! 💾',
  'Momen paling seru dari pembahasan {topic}. Komentar pendapat kamu di bawah! 👇',
  '{topic} — ringkasan singkat yang wajib kamu tonton. Follow untuk konten viral lainnya! ✨',
];

/**
 * Generate viral metadata for a clip
 */
export function generateViralMeta(clip) {
  const topic = clip.topic || 'Umum';
  const score = clip.viralScore || 50;

  // Title — use clip title + hook
  const hookIdx = Math.abs(hashCode(clip.title || '')) % HOOK_TEMPLATES_ID.length;
  const hook = HOOK_TEMPLATES_ID[hookIdx].replace('{topic}', topic);

  // Description
  const descIdx = Math.abs(hashCode(clip.id || '')) % DESC_TEMPLATES_ID.length;
  const description = DESC_TEMPLATES_ID[descIdx].replace('{topic}', topic);

  // Hashtags — combine base FYP + topic-specific
  const topicTags = TOPIC_HASHTAGS[topic] || TOPIC_HASHTAGS['Technology'] || [];
  const scoreTags = score >= 80 ? ['#viralbanget', '#wajib tonton'] : score >= 60 ? ['#recommended', '#musttwatch'] : [];
  const allHashtags = [...BASE_FYP_HASHTAGS, ...topicTags.slice(0, 4), ...scoreTags];

  // Full caption ready to paste
  const caption = `${hook}\n\n${description}\n\n${allHashtags.join(' ')}`;

  return {
    hook,
    description,
    hashtags: allHashtags,
    hashtagString: allHashtags.join(' '),
    caption,
  };
}

/**
 * Generate a timestamped YouTube link for a clip
 */
export function generateClipLink(sourceUrl, startTime) {
  if (!sourceUrl) return '';
  try {
    const url = new URL(sourceUrl);
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
      // For youtube.com/watch?v=xxx format
      if (url.hostname.includes('youtu.be')) {
        return `${sourceUrl}?t=${Math.floor(startTime)}`;
      }
      url.searchParams.set('t', Math.floor(startTime));
      return url.toString();
    }
  } catch {
    // Invalid URL
  }
  return sourceUrl;
}

// Simple hash function for consistent randomization
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}
