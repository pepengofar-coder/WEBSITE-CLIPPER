/**
 * Translation utility for Zenira
 * Uses LibreTranslate (free/open-source) as primary, with a mock fallback.
 * Supports Arabic as source language.
 */

const LIBRE_TRANSLATE_ENDPOINTS = [
  'https://libretranslate.com',
  'https://translate.terraprint.co',
  'https://lt.vern.cc',
];

export const SUPPORTED_LANGUAGES = [
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية (Arab)' },
  { code: 'ms', name: 'Bahasa Melayu' },
  { code: 'zh', name: '中文 (Mandarin)' },
  { code: 'es', name: 'Español (Spanyol)' },
  { code: 'fr', name: 'Français (Prancis)' },
  { code: 'de', name: 'Deutsch (Jerman)' },
  { code: 'pt', name: 'Português (Portugis)' },
  { code: 'ja', name: '日本語 (Jepang)' },
  { code: 'ko', name: '한국어 (Korea)' },
  { code: 'tr', name: 'Türkçe (Turki)' },
  { code: 'ur', name: 'اردو (Urdu)' },
  { code: 'hi', name: 'हिन्दी (Hindi)' },
];

export const SOURCE_LANGUAGES = [
  { code: 'en', name: 'English (Inggris)' },
  { code: 'ar', name: 'العربية (Arab)' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'auto', name: '🔍 Deteksi Otomatis' },
];

/**
 * Translate text using LibreTranslate API.
 * Falls back to a simple word-map mock if all endpoints fail.
 */
export async function translateText(text, targetLang = 'id', sourceLang = 'en') {
  if (!text || text.trim() === '') return '';
  if (sourceLang === targetLang) return text;

  // If auto-detect, try without specifying source
  const sourceParam = sourceLang === 'auto' ? 'auto' : sourceLang;

  // Try each endpoint
  for (const endpoint of LIBRE_TRANSLATE_ENDPOINTS) {
    try {
      const resp = await fetch(`${endpoint}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          source: sourceParam,
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

  // Fallback: simple word-map
  return mockTranslate(text, targetLang, sourceLang);
}

/**
 * Convert a transcript string into an SRT-formatted subtitle file.
 */
export function buildSRT(transcript, startOffsetSeconds = 0) {
  if (!transcript) return '';

  const words = transcript.trim().split(/\s+/);
  const chunkSize = 8;
  const lineDuration = 3;
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
  'right': 'tepat', 'we': 'kami', 'are': 'sedang',
  'looking': 'melihat', 'at': 'pada', 'for': 'untuk', 'and': 'dan',
  'could': 'bisa', 'small': 'kecil', 'habitat': 'habitat',
  'biggest': 'terbesar', 'challenge': 'tantangan',
  'rocket': 'roket', 'keeping': 'menjaga', 'humans': 'manusia', 'alive': 'hidup',
  'algorithm': 'algoritma', "doesn't": 'tidak', 'care': 'peduli',
  'about': 'tentang', 'truth': 'kebenaran', 'engagement': 'keterlibatan',
  'what': 'apa', 'gets': 'mendapat', 'outrage': 'kemarahan', 'fear': 'ketakutan',
  'controversy': 'kontroversi', 'fundamental': 'mendasar', 'problem': 'masalah',
  'sitting': 'duduk', 'classroom': 'kelas', 'hours': 'jam', 'industrial': 'industri',
  'age': 'era', 'concept': 'konsep', 'future': 'masa depan', 'personalized': 'personal',
  'tutors': 'tutor', 'adapt': 'beradaptasi', 'how': 'bagaimana', 'each': 'setiap',
  'student': 'siswa', 'learns': 'belajar', 'best': 'terbaik',
};

// Arabic → Indonesian common word map (for Islamic content)
const AR_ID_WORD_MAP = {
  'الله': 'Allah', 'بسم': 'dengan nama', 'الرحمن': 'Yang Maha Pengasih',
  'الرحيم': 'Yang Maha Penyayang', 'الحمد': 'segala puji', 'لله': 'bagi Allah',
  'رب': 'Tuhan', 'العالمين': 'semesta alam', 'إن': 'sesungguhnya',
  'الذين': 'orang-orang yang', 'آمنوا': 'beriman', 'قال': 'berkata',
  'النبي': 'Nabi', 'رسول': 'Rasul', 'محمد': 'Muhammad',
  'صلى': 'shalawat', 'عليه': 'atasnya', 'وسلم': 'dan salam',
  'القرآن': 'Al-Quran', 'سورة': 'surah', 'آية': 'ayat',
  'صلاة': 'shalat', 'زكاة': 'zakat', 'صيام': 'puasa', 'حج': 'haji',
  'إيمان': 'iman', 'إسلام': 'Islam', 'إحسان': 'ihsan',
  'دعاء': 'doa', 'ذكر': 'dzikir', 'تلاوة': 'tilawah',
  'علم': 'ilmu', 'عمل': 'amal', 'أخلاق': 'akhlak',
  'حلال': 'halal', 'حرام': 'haram', 'سنة': 'sunnah',
  'من': 'dari', 'في': 'di', 'على': 'atas', 'إلى': 'kepada',
  'هو': 'dia', 'هي': 'dia (pr)', 'هذا': 'ini', 'ذلك': 'itu',
  'كان': 'adalah', 'لا': 'tidak', 'ما': 'apa', 'كيف': 'bagaimana',
};

function mockTranslate(text, targetLang, sourceLang = 'en') {
  // Arabic → Indonesian
  if (sourceLang === 'ar' && targetLang === 'id') {
    return text
      .split(/\s+/)
      .map(word => {
        const clean = word.replace(/[.,!?،؟؛]/g, '');
        const translated = AR_ID_WORD_MAP[clean];
        return translated !== undefined ? translated : word;
      })
      .filter(w => w !== '')
      .join(' ');
  }

  // English → Indonesian
  if (targetLang === 'id') {
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

  // For other language combos, prefix with language tag
  return `[${targetLang.toUpperCase()}] ${text}`;
}
