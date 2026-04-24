/**
 * Translation utility for ClipForge
 * Uses LibreTranslate (free/open-source) as primary, with a mock fallback.
 */

const LIBRE_TRANSLATE_ENDPOINTS = [
  'https://libretranslate.com',
  'https://translate.terraprint.co',
  'https://lt.vern.cc',
];

export const SUPPORTED_LANGUAGES = [
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'ms', name: 'Malay (Bahasa Melayu)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
];

/**
 * Translate text using LibreTranslate API.
 * Falls back to a simple word-map mock if all endpoints fail.
 */
export async function translateText(text, targetLang = 'id', sourceLang = 'en') {
  if (!text || text.trim() === '') return '';
  if (sourceLang === targetLang) return text;

  // Try each endpoint
  for (const endpoint of LIBRE_TRANSLATE_ENDPOINTS) {
    try {
      const resp = await fetch(`${endpoint}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: 'text',
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (!resp.ok) continue;
      const data = await resp.json();
      if (data?.translatedText) return data.translatedText;
    } catch {
      // Try next endpoint
    }
  }

  // Fallback: simple word-map for Indonesian (most common use-case)
  return mockTranslate(text, targetLang);
}

/**
 * Convert a transcript string into an SRT-formatted subtitle file.
 * Splits long text into chunks of ~10 words, each shown for 3 seconds.
 */
export function buildSRT(transcript, startOffsetSeconds = 0) {
  if (!transcript) return '';

  const words = transcript.trim().split(/\s+/);
  const chunkSize = 8; // ~8 words per subtitle line
  const lineDuration = 3; // seconds per line
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  return chunks
    .map((chunk, idx) => {
      const start = startOffsetSeconds + idx * lineDuration;
      const end = start + lineDuration;
      return `${idx + 1}\n${toSRTTime(start)} --> ${toSRTTime(end)}\n${chunk}`;
    })
    .join('\n\n');
}

function toSRTTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const ms = Math.round((totalSeconds % 1) * 1000);
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':') + ',' + String(ms).padStart(3, '0');
}

// --- Mock fallback ---
const ID_WORD_MAP = {
  'this': 'ini', 'is': 'adalah', 'going': 'akan', 'to': 'untuk',
  'change': 'mengubah', 'everything': 'segalanya', 'ai': 'AI',
  "isn't": 'bukan', 'just': 'hanya', 'a': 'sebuah', 'tool': 'alat',
  'anymore': 'lagi', "it's": 'itu', 'becoming': 'menjadi',
  'collaborator': 'kolaborator', 'in': 'dalam', 'five': 'lima',
  'years': 'tahun', 'every': 'setiap', 'creative': 'kreatif',
  'process': 'proses', 'will': 'akan', 'have': 'memiliki',
  'integrated': 'terintegrasi', 'the': '', 'first': 'pertama',
  'patient': 'pasien', 'with': 'dengan', 'can': 'bisa', 'now': 'sekarang',
  'control': 'mengendalikan', 'cursor': 'kursor', 'by': 'dengan',
  'thinking': 'berpikir', 'that': 'itu', 'not': 'bukan', 'science': 'sains',
  'fiction': 'fiksi', 'literally': 'secara harfiah', 'happening': 'terjadi',
  'right': 'tepat', 'now': 'sekarang', 'we': 'kami', 'are': 'sedang',
  'looking': 'melihat', 'at': 'pada', 'for': 'untuk', 'and': 'dan',
  'could': 'bisa', 'small': 'kecil', 'habitat': 'habitat',
  'biggest': 'terbesar', 'challenge': 'tantangan', "isn't": 'bukan',
  'rocket': 'roket', 'keeping': 'menjaga', 'humans': 'manusia', 'alive': 'hidup',
  'algorithm': 'algoritma', "doesn't": 'tidak', 'care': 'peduli',
  'about': 'tentang', 'truth': 'kebenaran', 'engagement': 'keterlibatan',
  'what': 'apa', 'gets': 'mendapat', 'outrage': 'kemarahan', 'fear': 'ketakutan',
  'controversy': "kontroversi", 'fundamental': 'mendasar', 'problem': 'masalah',
  'sitting': 'duduk', 'classroom': 'kelas', 'hours': 'jam', 'industrial': 'industri',
  'age': 'era', 'concept': 'konsep', 'future': 'masa depan', 'personalized': 'personal',
  'tutors': 'tutor', 'adapt': 'beradaptasi', 'how': 'bagaimana', 'each': 'setiap',
  'student': 'siswa', 'learns': 'belajar', 'best': 'terbaik',
};

function mockTranslate(text, targetLang) {
  if (targetLang !== 'id') {
    // For other languages, return a note that translation service is unavailable
    return `[${targetLang.toUpperCase()} translation] ${text}`;
  }

  return text
    .split(/\s+/)
    .map(word => {
      const lower = word.toLowerCase().replace(/[.,!?]/g, '');
      const translated = ID_WORD_MAP[lower];
      return translated !== undefined ? translated : word;
    })
    .filter(w => w !== '')
    .join(' ');
}
