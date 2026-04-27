/**
 * YouKlip Backend Server
 *
 * Express server providing:
 * - GET  /health          → Health check
 * - POST /api/check-url   → Validate URL and get video metadata via yt-dlp
 * - POST /api/export-mp4  → Download, trim, and encode video to MP4
 * - GET  /outputs/:file   → Serve generated MP4 files
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { detectPlatform, isValidUrl, SUPPORTED_PLATFORMS } from './lib/platforms.js';
import { getVideoInfo, downloadVideo } from './lib/ytdlp.js';
import { trimVideo, getVideoDuration } from './lib/ffmpeg.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ── Config ──
const PORT = parseInt(process.env.PORT || '3001', 10);
const OUTPUTS_DIR = resolve(process.env.OUTPUTS_DIR || join(__dirname, 'outputs'));
const TEMP_DIR = resolve(process.env.TEMP_DIR || join(__dirname, 'temp'));
const MAX_VIDEO_DURATION = parseInt(process.env.MAX_VIDEO_DURATION || '7200', 10); // 2 hours
const CLEANUP_INTERVAL = parseInt(process.env.CLEANUP_INTERVAL_MS || '1800000', 10); // 30 min
const MAX_FILE_AGE_MS = 60 * 60 * 1000; // 1 hour

// Ensure directories exist
[OUTPUTS_DIR, TEMP_DIR].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

// ── Express app ──
const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// Configure CORS for local dev and Vercel production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '1mb' }));

// ── Serve output files ──
app.use('/outputs', express.static(OUTPUTS_DIR, {
  setHeaders(res) {
    res.set('Content-Type', 'video/mp4');
    res.set('Content-Disposition', 'attachment');
    // Enable CORS for outputs so frontend can download it
    res.set('Access-Control-Allow-Origin', '*');
  },
}));

// ══════════════════════════════════════════════
// GET /health
// ══════════════════════════════════════════════
app.get('/health', (_req, res) => {
  console.log('[Health] OK');
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ══════════════════════════════════════════════
// POST /api/check-url
// ══════════════════════════════════════════════
app.post('/api/check-url', async (req, res) => {
  const { sourceUrl } = req.body;

  // Validate input
  if (!sourceUrl || typeof sourceUrl !== 'string') {
    return res.status(400).json({
      ok: false,
      isSupported: false,
      error: 'Parameter "sourceUrl" diperlukan.',
    });
  }

  if (!isValidUrl(sourceUrl)) {
    return res.status(400).json({
      ok: false,
      isSupported: false,
      error: 'URL tidak valid. Pastikan dimulai dengan http:// atau https://',
    });
  }

  // Detect platform
  const platform = detectPlatform(sourceUrl);

  if (!platform) {
    return res.json({
      ok: false,
      isSupported: false,
      error: `Platform tidak dikenali. Platform yang didukung: ${SUPPORTED_PLATFORMS.join(', ')}.`,
    });
  }

  // Get video info via yt-dlp
  try {
    console.log(`[check-url] Checking: ${sourceUrl} (${platform.name})`);
    const info = await getVideoInfo(sourceUrl);

    // Validate duration
    if (info.duration > MAX_VIDEO_DURATION) {
      return res.json({
        ok: false,
        isSupported: true,
        error: `Video terlalu panjang (${Math.floor(info.duration / 60)} menit). Maksimal ${MAX_VIDEO_DURATION / 60} menit.`,
      });
    }

    console.log(`[check-url] Success: "${info.title}" (${info.duration}s)`);

    return res.json({
      ok: true,
      isSupported: true,
      platform: platform.name,
      platformIcon: platform.icon,
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
      webpageUrl: info.webpageUrl,
      uploader: info.uploader,
      sourceUrl,
    });
  } catch (err) {
    console.error(`[check-url] Failed:`, err.message);
    return res.json({
      ok: false,
      isSupported: false,
      error: err.message || 'Link tidak bisa diproses. Pastikan video public dan berasal dari platform yang didukung.',
    });
  }
});

// ══════════════════════════════════════════════
// POST /api/export-mp4
// ══════════════════════════════════════════════
app.post('/api/export-mp4', async (req, res) => {
  const { sourceUrl, title, startTime = 0, endTime, quality = '720p', subtitleLang, withSubtitles = false } = req.body;

  console.log('[Export] started');
  console.log('[Export] sourceUrl:', sourceUrl);

  // ── Validate inputs ──
  if (!sourceUrl || typeof sourceUrl !== 'string') {
    return res.status(400).json({ ok: false, error: 'Parameter "sourceUrl" diperlukan.' });
  }

  if (!isValidUrl(sourceUrl)) {
    return res.status(400).json({ ok: false, error: 'URL tidak valid.' });
  }

  const start = parseFloat(startTime) || 0;
  const end = parseFloat(endTime) || 0;

  if (end <= start && end !== 0) {
    return res.status(400).json({
      ok: false,
      error: `Timestamp tidak valid: endTime (${end}) harus lebih besar dari startTime (${start}).`,
    });
  }

  if (!['720p', '1080p'].includes(quality)) {
    return res.status(400).json({ ok: false, error: 'Kualitas harus "720p" atau "1080p".' });
  }

  const jobId = randomUUID().substring(0, 8);
  const safeName = (title || 'youklip-output')
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 40);
  const outputFilename = `youklip-${safeName}-${jobId}.mp4`;
  const downloadPath = join(TEMP_DIR, `download-${jobId}.mp4`);
  const outputPath = join(OUTPUTS_DIR, outputFilename);

  console.log(`[export] Job ${jobId}: ${sourceUrl} | ${start}s → ${end}s | ${quality}`);

  try {
    // Step 1: Download video
    console.log(`[export] Step 1: Downloading video...`);
    const actualDownload = await downloadVideo(sourceUrl, downloadPath, quality);

    // Step 2: Get real duration if endTime not specified
    let finalEnd = end;
    if (finalEnd <= start) {
      const videoDuration = await getVideoDuration(actualDownload);
      finalEnd = Math.min(videoDuration, start + 60); // Default: 60 seconds from start
      console.log(`[export] Auto endTime: ${finalEnd}s (video duration: ${videoDuration}s)`);
    }

    // Validate timestamps against actual video
    const videoDuration = await getVideoDuration(actualDownload);
    if (start >= videoDuration) {
      throw new Error(
        `startTime (${start}s) melebihi durasi video (${Math.floor(videoDuration)}s). ` +
        'Pastikan timestamp berada dalam durasi video.'
      );
    }
    finalEnd = Math.min(finalEnd, videoDuration);

    // Step 3: Trim with FFmpeg
    console.log(`[export] Step 2: Trimming ${start}s → ${finalEnd}s...`);
    const result = await trimVideo(actualDownload, outputPath, start, finalEnd, { quality });

    // Step 4: Build download URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const downloadUrl = `${baseUrl}/outputs/${outputFilename}`;

    console.log(`[export] ✅ Job ${jobId} complete: ${outputFilename} (${(result.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log('[Export] output:', downloadUrl);

    return res.json({
      ok: true,
      filename: outputFilename,
      size: result.size,
      downloadUrl,
    });
  } catch (err) {
    console.error(`[export] ❌ Job ${jobId} failed:`, err.message);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Gagal mengekspor video. Silakan coba lagi.',
    });
  } finally {
    // Cleanup temp download file
    try {
      if (existsSync(downloadPath)) unlinkSync(downloadPath);
    } catch {}
  }
});

// ══════════════════════════════════════════════
// Periodic cleanup of old output files
// ══════════════════════════════════════════════
function cleanupOldFiles() {
  try {
    const files = readdirSync(OUTPUTS_DIR);
    const now = Date.now();
    let cleaned = 0;

    for (const file of files) {
      const filePath = join(OUTPUTS_DIR, file);
      try {
        const stats = statSync(filePath);
        if (now - stats.mtimeMs > MAX_FILE_AGE_MS) {
          unlinkSync(filePath);
          cleaned++;
        }
      } catch {}
    }

    if (cleaned > 0) {
      console.log(`[cleanup] Removed ${cleaned} old output file(s)`);
    }
  } catch {}
}

setInterval(cleanupOldFiles, CLEANUP_INTERVAL);

// ══════════════════════════════════════════════
// Error handler
// ══════════════════════════════════════════════
app.use((err, _req, res, _next) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({
    ok: false,
    error: 'Terjadi kesalahan internal server. Silakan coba lagi.',
  });
});

// ══════════════════════════════════════════════
// Start
// ══════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n🚀 YouKlip Backend running on http://localhost:${PORT}`);
  console.log(`   Health:    GET  http://localhost:${PORT}/health`);
  console.log(`   Check URL: POST http://localhost:${PORT}/api/check-url`);
  console.log(`   Export:    POST http://localhost:${PORT}/api/export-mp4`);
  console.log(`   Outputs:   GET  http://localhost:${PORT}/outputs/<filename>\n`);
});
