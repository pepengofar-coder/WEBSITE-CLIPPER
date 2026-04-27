/**
 * FFmpeg wrapper for YouKlip backend.
 *
 * Requires ffmpeg to be installed and available in PATH.
 * Install: winget install ffmpeg (Windows) or apt install ffmpeg (Linux)
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { stat } from 'node:fs/promises';

const execFileAsync = promisify(execFile);

const FFMPEG_BIN = process.env.FFMPEG_PATH || 'ffmpeg';
const FFPROBE_BIN = process.env.FFPROBE_PATH || 'ffprobe';

/**
 * Get the duration of a video file in seconds.
 *
 * @param {string} filePath
 * @returns {Promise<number>}
 */
export async function getVideoDuration(filePath) {
  try {
    const { stdout } = await execFileAsync(FFPROBE_BIN, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath,
    ], { timeout: 30_000 });

    const duration = parseFloat(stdout.trim());
    if (isNaN(duration)) throw new Error('Tidak bisa membaca durasi video.');
    return duration;
  } catch (err) {
    console.error('[ffprobe] Error:', err.message);
    throw new Error('Gagal membaca informasi video.');
  }
}

/**
 * Trim and re-encode a video to MP4 (H.264 + AAC).
 *
 * @param {string} inputPath  - Source video file
 * @param {string} outputPath - Output MP4 file path
 * @param {number} startTime  - Start time in seconds
 * @param {number} endTime    - End time in seconds
 * @param {object} options    - { quality: '720p'|'1080p' }
 * @returns {Promise<{ path: string, size: number }>}
 */
export async function trimVideo(inputPath, outputPath, startTime, endTime, options = {}) {
  const duration = endTime - startTime;
  if (duration <= 0) {
    throw new Error('endTime harus lebih besar dari startTime.');
  }

  const { quality = '720p' } = options;
  const scale = quality === '1080p'
    ? 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black'
    : 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:black';

  const args = [
    '-y',                          // Overwrite output
    '-ss', String(startTime),      // Seek (before -i = fast seek)
    '-i', inputPath,
    '-t', String(duration),        // Duration
    '-vf', scale,                  // Scale to 9:16
    '-c:v', 'libx264',
    '-preset', 'fast',             // Faster than ultrafast, better quality
    '-crf', '23',                  // Good quality
    '-pix_fmt', 'yuv420p',         // Maximum compatibility
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',     // Progressive playback
    '-metadata', 'title=YouKlip Export',
    outputPath,
  ];

  console.log(`[ffmpeg] Trimming: ${startTime}s → ${endTime}s (${duration}s) | ${quality}`);

  try {
    await execFileAsync(FFMPEG_BIN, args, {
      timeout: 180_000, // 3 minute timeout
      maxBuffer: 10 * 1024 * 1024,
    });

    // Validate output
    const stats = await stat(outputPath);
    console.log(`[ffmpeg] Output: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

    if (stats.size < 10_000) {
      throw new Error(
        `Output MP4 terlalu kecil (${(stats.size / 1024).toFixed(1)} KB). ` +
        'Kemungkinan encoding gagal. Periksa timestamp dan format sumber video.'
      );
    }

    return { path: outputPath, size: stats.size };
  } catch (err) {
    if (err.message && !err.stderr) throw err;
    console.error('[ffmpeg] Error:', err.stderr || err.message);
    throw new Error('Gagal memproses video dengan FFmpeg. Pastikan format video didukung.');
  }
}
