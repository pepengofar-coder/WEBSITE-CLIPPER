/**
 * Video Processor for ClipForge
 * Uses FFmpeg.wasm to process video with burned-in captions in the browser.
 * Lazy-loads FFmpeg only when needed.
 */

let ffmpegInstance = null;
let ffmpegLoading = false;

/**
 * Load FFmpeg.wasm lazily (only once).
 * @param {Function} onProgress - progress callback (0-1)
 */
async function loadFFmpeg(onProgress) {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) {
    // Wait for existing load
    while (ffmpegLoading) {
      await new Promise(r => setTimeout(r, 200));
    }
    return ffmpegInstance;
  }

  ffmpegLoading = true;
  try {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    const ffmpeg = new FFmpeg();

    ffmpeg.on('progress', ({ progress }) => {
      if (onProgress) onProgress(progress);
    });

    ffmpeg.on('log', ({ message }) => {
      // Debug: console.log('[FFmpeg]', message);
    });

    await ffmpeg.load();
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  } finally {
    ffmpegLoading = false;
  }
}

/**
 * Process a video file with burned-in captions.
 * @param {File|Blob} videoFile - Input video file
 * @param {string} srtText - SRT subtitle content
 * @param {number} startTime - Trim start time (seconds)
 * @param {number} endTime - Trim end time (seconds)
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Blob>} - Processed MP4 blob
 */
export async function processVideoWithCaptions(videoFile, srtText, startTime = 0, endTime = 0, onProgress) {
  const updateProgress = (phase, phasePct) => {
    // phase 0 = loading (0-20%), phase 1 = processing (20-90%), phase 2 = reading (90-100%)
    const bases = [0, 20, 90];
    const ranges = [20, 70, 10];
    const total = bases[phase] + (phasePct * ranges[phase]);
    if (onProgress) onProgress(Math.min(Math.round(total), 100));
  };

  // Phase 0: Load FFmpeg
  updateProgress(0, 0);
  const ffmpeg = await loadFFmpeg((p) => updateProgress(0, p));
  updateProgress(0, 1);

  const { fetchFile } = await import('@ffmpeg/util');

  // Write input video
  const videoData = await fetchFile(videoFile);
  await ffmpeg.writeFile('input.mp4', videoData);

  // Write SRT subtitle if provided
  if (srtText && srtText.trim()) {
    const encoder = new TextEncoder();
    await ffmpeg.writeFile('subs.srt', encoder.encode(srtText));
  }

  // Build FFmpeg command
  const args = ['-i', 'input.mp4'];

  // Trim if both start and end are specified
  if (startTime > 0 || endTime > 0) {
    args.push('-ss', String(startTime));
    if (endTime > startTime) {
      args.push('-t', String(endTime - startTime));
    }
  }

  // Video filter: scale to 9:16 + burn subtitles
  let vf = 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black';

  if (srtText && srtText.trim()) {
    // Burn subtitles with styled text (bold, white with black outline)
    vf += ",subtitles=subs.srt:force_style='FontSize=24,FontName=Arial,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Bold=1,Alignment=2,MarginV=60'";
  }

  args.push('-vf', vf);

  // Output encoding settings (optimized for web/mobile)
  args.push(
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-y',
    'output.mp4'
  );

  // Phase 1: Process video
  ffmpeg.on('progress', ({ progress }) => {
    updateProgress(1, Math.max(0, Math.min(1, progress)));
  });

  await ffmpeg.exec(args);

  // Phase 2: Read output
  updateProgress(2, 0);
  const outputData = await ffmpeg.readFile('output.mp4');
  updateProgress(2, 1);

  // Cleanup
  try {
    await ffmpeg.deleteFile('input.mp4');
    await ffmpeg.deleteFile('output.mp4');
    if (srtText) await ffmpeg.deleteFile('subs.srt');
  } catch {}

  return new Blob([outputData.buffer], { type: 'video/mp4' });
}

/**
 * Download a blob as a file to the user's device.
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Delay revoke to ensure download starts
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Check if FFmpeg.wasm is supported in this browser.
 */
export function isFFmpegSupported() {
  return typeof SharedArrayBuffer !== 'undefined' || typeof WebAssembly !== 'undefined';
}
