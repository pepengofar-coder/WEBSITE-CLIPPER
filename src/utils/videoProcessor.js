/**
 * Video Processor for YouKlip
 *
 * Uses FFmpeg.wasm to process video with burned-in captions in the browser.
 * Lazy-loads FFmpeg only when needed.
 *
 * Key design decisions:
 * - Uses single-threaded core (no SharedArrayBuffer requirement = works everywhere)
 * - Burns subtitles via the `drawtext` filter (no libass dependency)
 * - Provides clear error messages at every stage
 */

let ffmpegInstance = null;
let loadingPromise = null;

/**
 * Load FFmpeg.wasm lazily (only once).
 * Returns the same promise if already loading to avoid double-init.
 */
async function loadFFmpeg(onLog) {
  if (ffmpegInstance) return ffmpegInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');

      const ffmpeg = new FFmpeg();

      if (onLog) {
        ffmpeg.on('log', ({ message }) => {
          onLog(message);
        });
      }

      // Load the single-threaded core from CDN (no COOP/COEP needed)
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegInstance = ffmpeg;
      return ffmpeg;
    } catch (err) {
      loadingPromise = null; // Allow retry on failure
      throw new Error(`Gagal memuat FFmpeg: ${err.message}`);
    }
  })();

  return loadingPromise;
}

/**
 * Parse SRT text into an array of subtitle cues.
 * Each cue: { index, startSec, endSec, text }
 */
function parseSRT(srtText) {
  if (!srtText || !srtText.trim()) return [];

  const blocks = srtText.trim().split(/\n\s*\n/);
  const cues = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    const timeLine = lines[1];
    const match = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/
    );
    if (!match) continue;

    const startSec = +match[1] * 3600 + +match[2] * 60 + +match[3] + +match[4] / 1000;
    const endSec = +match[5] * 3600 + +match[6] * 60 + +match[7] + +match[8] / 1000;
    const text = lines.slice(2).join(' ').replace(/'/g, "'\\''"); // Escape single quotes for FFmpeg

    cues.push({ index: +lines[0], startSec, endSec, text });
  }

  return cues;
}

/**
 * Build a drawtext filter chain from SRT cues.
 * This replaces the `subtitles` filter which requires libass (not in standard wasm build).
 */
function buildDrawtextFilter(cues, offsetSec = 0) {
  if (!cues.length) return '';

  return cues.map((cue) => {
    const start = Math.max(0, cue.startSec - offsetSec);
    const end = Math.max(start, cue.endSec - offsetSec);
    // Escape special characters for drawtext
    const safeText = cue.text
      .replace(/\\/g, '\\\\')
      .replace(/:/g, '\\:')
      .replace(/'/g, "'\\'")
      .replace(/%/g, '%%');

    return `drawtext=text='${safeText}':fontsize=28:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-80:enable='between(t,${start.toFixed(3)},${end.toFixed(3)})'`;
  }).join(',');
}

/** Minimum valid MP4 size in bytes — anything smaller is considered a failed export */
const MIN_VALID_MP4_SIZE = 10 * 1024; // 10 KB

/**
 * Process a video file with burned-in captions.
 *
 * @param {File|Blob} videoFile - Input video file
 * @param {string} srtText - SRT subtitle content (optional)
 * @param {number} startTime - Trim start (seconds)
 * @param {number} endTime - Trim end (seconds)
 * @param {Function} onProgress - Progress callback (0–100)
 * @returns {Promise<Blob>} MP4 blob ready for download
 */
export async function processVideoWithCaptions(videoFile, srtText, startTime = 0, endTime = 0, onProgress) {

  const report = (pct) => { if (onProgress) onProgress(Math.min(100, Math.max(0, Math.round(pct)))); };

  // ── Phase 0  (0–15 %): Load FFmpeg ──
  report(0);
  console.log('[YouKlip Export] Memulai proses export MP4...');
  console.log('[YouKlip Export] Input file:', videoFile.name || 'blob', '| Size:', (videoFile.size / 1024 / 1024).toFixed(2), 'MB');
  console.log('[YouKlip Export] Trim:', startTime, '->', endTime, 'detik');

  const logs = [];
  const ffmpeg = await loadFFmpeg((msg) => logs.push(msg));
  report(15);
  console.log('[YouKlip Export] FFmpeg berhasil dimuat');

  // ── Phase 1  (15–25 %): Write input files ──
  const { fetchFile } = await import('@ffmpeg/util');

  report(18);
  let videoData;
  try {
    videoData = await fetchFile(videoFile);
  } catch (err) {
    throw new Error(`Gagal membaca file video: ${err.message}`);
  }

  console.log('[YouKlip Export] Video data loaded, size:', videoData.byteLength, 'bytes');

  if (!videoData || videoData.byteLength < 1000) {
    throw new Error('File video terlalu kecil atau kosong. Pastikan file video valid.');
  }

  await ffmpeg.writeFile('input.mp4', videoData);
  report(25);
  console.log('[YouKlip Export] File ditulis ke virtual filesystem');

  // ── Phase 2  (25–30 %): Build command ──
  // IMPORTANT: Place -ss BEFORE -i for fast seeking (input-level seeking)
  // This avoids decoding the entire file up to the seek point
  const args = [];

  // Fast seek: -ss before -i does input-level seeking
  if (startTime > 0) {
    args.push('-ss', String(startTime));
  }

  args.push('-i', 'input.mp4');

  // Duration limit (use -t after -i)
  if (endTime > startTime) {
    args.push('-t', String(endTime - startTime));
  }

  // Video filter chain
  const filters = [];

  // Scale to 9:16
  filters.push('scale=1080:1920:force_original_aspect_ratio=decrease');
  filters.push('pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black');

  // Burn subtitles via drawtext (works without libass)
  if (srtText && srtText.trim()) {
    const cues = parseSRT(srtText);
    if (cues.length > 0) {
      const dtFilter = buildDrawtextFilter(cues, startTime);
      if (dtFilter) filters.push(dtFilter);
    }
  }

  args.push('-vf', filters.join(','));

  // Encoding: H.264 + AAC + faststart
  args.push(
    '-c:v', 'libx264',
    '-preset', 'ultrafast',   // Fastest for in-browser
    '-crf', '28',             // Slightly lower quality = much faster
    '-pix_fmt', 'yuv420p',    // Maximum compatibility (iOS, Android, Chrome, Safari)
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart', // Enables progressive playback
    '-y',                      // Overwrite output
    'output.mp4'
  );

  report(30);
  console.log('[YouKlip Export] FFmpeg command:', ['ffmpeg', ...args].join(' '));

  // ── Phase 3  (30–90 %): Execute FFmpeg ──
  const progressHandler = ({ progress }) => {
    const pct = 30 + Math.min(60, progress * 60);
    report(pct);
  };
  ffmpeg.on('progress', progressHandler);

  try {
    await ffmpeg.exec(args);
  } catch (err) {
    ffmpeg.off('progress', progressHandler);
    const tail = logs.slice(-10).join('\n');
    console.error('[YouKlip Export] FFmpeg exec gagal:', err);
    console.error('[YouKlip Export] Log terakhir:\n', tail);
    throw new Error(`FFmpeg gagal: ${err.message}\n\nLog:\n${tail}`);
  }

  ffmpeg.off('progress', progressHandler);
  report(90);
  console.log('[YouKlip Export] FFmpeg exec selesai');

  // ── Phase 4  (90–98 %): Read output ──
  let outputData;
  try {
    outputData = await ffmpeg.readFile('output.mp4');
  } catch (readErr) {
    const tail = logs.slice(-10).join('\n');
    console.error('[YouKlip Export] Gagal membaca output.mp4:', readErr);
    console.error('[YouKlip Export] Log terakhir:\n', tail);
    throw new Error(`Output MP4 tidak ditemukan. FFmpeg mungkin gagal.\n\nLog:\n${tail}`);
  }
  report(98);

  // ── Validate output ──
  const outputSize = outputData ? outputData.byteLength || outputData.length || 0 : 0;
  console.log('[YouKlip Export] Output size:', outputSize, 'bytes', `(${(outputSize / 1024).toFixed(1)} KB)`);

  if (!outputData || outputSize === 0) {
    const tail = logs.slice(-10).join('\n');
    console.error('[YouKlip Export] Output kosong! Log:\n', tail);
    throw new Error('Output MP4 kosong — FFmpeg tidak menghasilkan file.');
  }

  if (outputSize < MIN_VALID_MP4_SIZE) {
    const tail = logs.slice(-10).join('\n');
    console.error(`[YouKlip Export] Output terlalu kecil (${outputSize} bytes). Log:\n`, tail);
    throw new Error(
      `Output MP4 terlalu kecil (${(outputSize / 1024).toFixed(1)} KB). ` +
      `File video minimal harus ${(MIN_VALID_MP4_SIZE / 1024).toFixed(0)} KB. ` +
      `Kemungkinan penyebab: video sumber terlalu pendek, timestamp di luar durasi video, atau format tidak didukung.`
    );
  }

  // ── Phase 5  (98–100 %): Cleanup ──
  try { await ffmpeg.deleteFile('input.mp4'); } catch {}
  try { await ffmpeg.deleteFile('output.mp4'); } catch {}

  report(100);

  // Convert to a safe Uint8Array copy to avoid SharedArrayBuffer issues.
  // Some browsers return a Uint8Array backed by SharedArrayBuffer which Blob rejects.
  const safeData = new Uint8Array(outputData);
  const blob = new Blob([safeData], { type: 'video/mp4' });

  console.log('[YouKlip Export] ✅ Blob created successfully, size:', blob.size, 'bytes', `(${(blob.size / 1024 / 1024).toFixed(2)} MB)`);

  return blob;
}

/**
 * Download a blob as a file to the user's device.
 * Uses a temporary <a> element with download attribute.
 *
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for the download (default: youklip-output.mp4)
 */
export function downloadBlob(blob, filename = 'youklip-output.mp4') {
  // Sanitize filename — remove characters that could cause issues
  const safeName = filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_') // Remove illegal filename chars
    .replace(/_+/g, '_')                     // Collapse multiple underscores
    .trim() || 'youklip-output.mp4';        // Fallback if empty after sanitization

  console.log('[YouKlip Download] Triggering download:', safeName, '| Size:', blob.size, 'bytes');

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  a.style.display = 'none';

  // Some browsers require the element to be in the DOM
  document.body.appendChild(a);

  // Use a microtask to ensure the element is in the DOM before clicking
  requestAnimationFrame(() => {
    a.click();

    // Cleanup after a short delay so the download can start
    setTimeout(() => {
      if (a.parentNode) {
        document.body.removeChild(a);
      }
      URL.revokeObjectURL(url);
    }, 15000);
  });
}

/**
 * Check if FFmpeg.wasm can run in this browser.
 */
export function isFFmpegSupported() {
  return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
}
