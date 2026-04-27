/**
 * yt-dlp wrapper for YouKlip backend.
 *
 * Requires yt-dlp to be installed and available in PATH.
 * Install: winget install yt-dlp (Windows) or pip install yt-dlp (cross-platform)
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { stat } from 'node:fs/promises';

const execFileAsync = promisify(execFile);

// Locate yt-dlp binary
const YTDLP_BIN = process.env.YTDLP_PATH || 'yt-dlp';

/**
 * Known error patterns from yt-dlp and their user-friendly messages.
 */
const ERROR_MAP = [
  { pattern: /is not available/i,          message: 'Video ini tidak tersedia. Mungkin sudah dihapus.' },
  { pattern: /private video/i,             message: 'Video ini bersifat privat. Pastikan video dapat diakses publik.' },
  { pattern: /sign in/i,                   message: 'Video ini memerlukan login. Pastikan video dapat diakses tanpa login.' },
  { pattern: /login required/i,            message: 'Video ini memerlukan login untuk diakses.' },
  { pattern: /geo.?restrict/i,             message: 'Video ini dibatasi berdasarkan wilayah (geo-restricted).' },
  { pattern: /copyright/i,                 message: 'Video ini diblokir karena hak cipta.' },
  { pattern: /age.?restrict/i,             message: 'Video ini dibatasi berdasarkan usia dan memerlukan login.' },
  { pattern: /unsupported url/i,           message: 'URL ini tidak didukung oleh yt-dlp.' },
  { pattern: /no video formats/i,          message: 'Tidak ditemukan format video yang bisa diunduh.' },
  { pattern: /unable to extract/i,         message: 'Gagal mengekstrak informasi video. URL mungkin tidak valid.' },
  { pattern: /HTTP Error 404/i,            message: 'Video tidak ditemukan (404). Periksa kembali link Anda.' },
  { pattern: /HTTP Error 403/i,            message: 'Akses ditolak (403). Video mungkin privat atau memerlukan login.' },
];

/**
 * Parse a yt-dlp error into a user-friendly message.
 */
function parseError(stderr) {
  const combined = stderr || '';
  for (const { pattern, message } of ERROR_MAP) {
    if (pattern.test(combined)) return message;
  }
  return 'Gagal memproses video. Pastikan link valid dan video dapat diakses publik.';
}

/**
 * Get video metadata via yt-dlp --dump-json.
 *
 * @param {string} url - Video URL
 * @returns {Promise<object>} Video metadata
 */
export async function getVideoInfo(url) {
  try {
    const { stdout, stderr } = await execFileAsync(YTDLP_BIN, [
      '--dump-json',
      '--no-playlist',
      '--no-warnings',
      '--socket-timeout', '30',
      url,
    ], {
      timeout: 60_000, // 60 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10 MB buffer for large JSON
    });

    if (!stdout || !stdout.trim()) {
      throw new Error(parseError(stderr));
    }

    const info = JSON.parse(stdout.trim());

    return {
      title: info.title || info.fulltitle || 'Untitled',
      duration: info.duration || 0,
      thumbnail: info.thumbnail || info.thumbnails?.[info.thumbnails.length - 1]?.url || null,
      webpageUrl: info.webpage_url || url,
      uploader: info.uploader || info.channel || null,
      uploadDate: info.upload_date || null,
      viewCount: info.view_count || null,
      description: (info.description || '').substring(0, 500),
      extractor: info.extractor || info.extractor_key || null,
    };
  } catch (err) {
    // If it's our custom error, re-throw
    if (err.message && !err.stderr) throw err;

    // Parse yt-dlp stderr for user-friendly message
    const friendlyMessage = parseError(err.stderr || err.message || '');
    throw new Error(friendlyMessage);
  }
}

/**
 * Download video to a specific output path using yt-dlp.
 *
 * @param {string} url - Video URL
 * @param {string} outputPath - Desired output file path
 * @param {string} quality - '720p' or '1080p'
 * @returns {Promise<string>} Actual output file path
 */
export async function downloadVideo(url, outputPath, quality = '720p') {
  // Build format selector based on quality
  const height = quality === '1080p' ? 1080 : 720;
  const formatSelector = `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`;

  const args = [
    '-f', formatSelector,
    '--merge-output-format', 'mp4',
    '--no-playlist',
    '--no-warnings',
    '--socket-timeout', '30',
    '-o', outputPath,
    url,
  ];

  console.log(`[yt-dlp] Downloading: ${url} → ${outputPath} (${quality})`);

  try {
    const { stdout, stderr } = await execFileAsync(YTDLP_BIN, args, {
      timeout: 300_000, // 5 minute timeout for downloads
      maxBuffer: 10 * 1024 * 1024,
    });

    // Verify output file exists and is reasonable size
    if (!existsSync(outputPath)) {
      // yt-dlp might add extension — check common variants
      const variants = [outputPath, `${outputPath}.mp4`, outputPath.replace(/\.[^.]+$/, '.mp4')];
      const found = variants.find(p => existsSync(p));
      if (!found) {
        throw new Error('yt-dlp selesai tapi file output tidak ditemukan.');
      }
      return found;
    }

    const stats = await stat(outputPath);
    console.log(`[yt-dlp] Download complete: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    if (stats.size < 10_000) {
      throw new Error('File video yang diunduh terlalu kecil. Kemungkinan download gagal.');
    }

    return outputPath;
  } catch (err) {
    if (err.message && !err.stderr) throw err;
    const friendlyMessage = parseError(err.stderr || err.message || '');
    throw new Error(friendlyMessage);
  }
}
