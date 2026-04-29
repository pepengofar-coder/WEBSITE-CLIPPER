import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, unlinkSync, statSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

import { trimVideo } from './lib/ffmpeg.js';

dotenv.config();

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const PORT = parseInt(process.env.PORT || '3001', 10);
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const OUTPUTS_DIR = resolve(join(__dirname, 'outputs'));
const TEMP_DIR = resolve(join(__dirname, 'temp'));

[OUTPUTS_DIR, TEMP_DIR].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

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

app.use(express.json({ limit: '10mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// ══════════════════════════════════════════════
// POST /api/render
// ══════════════════════════════════════════════
app.post('/api/render', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { input_video_path, start_time = 0, end_time = 0, quality = '720p', title } = req.body;

    if (!input_video_path) {
      return res.status(400).json({ error: 'input_video_path is required' });
    }

    // Insert job into render_jobs
    const { data: job, error: insertError } = await supabase
      .from('render_jobs')
      .insert({
        user_id: user.id,
        input_video_path,
        start_time,
        end_time,
        quality,
        title: title || 'Zenira Clip',
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to create job' });
    }

    // Return response immediately, process in background
    res.status(201).json({
      ok: true,
      job_id: job.id,
      status: job.status,
      message: 'Job created. Rendering started.'
    });

    // Start background processing
    processJob(job).catch(console.error);

  } catch (err) {
    console.error('Render API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function processJob(job) {
  console.log(`[Worker] Starting job ${job.id}`);
  
  await supabase.from('render_jobs').update({ status: 'processing' }).eq('id', job.id);
  
  const jobId = job.id;
  const inputStoragePath = job.input_video_path;
  const inputFileName = inputStoragePath.split('/').pop() || `input-${jobId}.mp4`;
  const tempInputPath = join(TEMP_DIR, `${jobId}-${inputFileName}`);
  
  const safeTitle = (job.title || 'youklip-output')
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 40);
    
  const outputFileName = `youklip-${safeTitle}-${jobId.substring(0,8)}.mp4`;
  const outputFilePath = join(OUTPUTS_DIR, outputFileName);
  
  try {
    console.log(`[Worker] Downloading ${inputStoragePath} to ${tempInputPath}`);
    
    const { data: downloadData, error: downloadError } = await supabase.storage.from('uploads').download(inputStoragePath);
    if (downloadError) throw new Error(`Failed to download from storage: ${downloadError.message}`);
    
    const buffer = Buffer.from(await downloadData.arrayBuffer());
    const fs = await import('node:fs/promises');
    await fs.writeFile(tempInputPath, buffer);
    
    console.log(`[Worker] Trimming video: start=${job.start_time}, end=${job.end_time}, quality=${job.quality}`);
    const result = await trimVideo(tempInputPath, outputFilePath, job.start_time, job.end_time, { quality: job.quality });
    
    console.log(`[Worker] Uploading result to storage...`);
    const outputStoragePath = `${job.user_id}/${outputFileName}`;
    const fileData = readFileSync(result.path);
    const { error: uploadError } = await supabase.storage.from('results').upload(outputStoragePath, fileData, {
      upsert: true,
      contentType: 'video/mp4'
    });
    if (uploadError) throw uploadError;
    
    console.log(`[Worker] Job ${job.id} complete. Uploaded to ${outputStoragePath}`);
    
    await supabase.from('render_jobs').update({
      status: 'completed',
      output_video_path: outputStoragePath,
      file_size: result.size
    }).eq('id', job.id);
    
  } catch (error) {
    console.error(`[Worker] Job ${job.id} failed:`, error.message);
    await supabase.from('render_jobs').update({
      status: 'failed',
      error_message: error.message
    }).eq('id', job.id);
  } finally {
    try {
      if (existsSync(tempInputPath)) unlinkSync(tempInputPath);
      if (existsSync(outputFilePath)) unlinkSync(outputFilePath);
    } catch (e) {
      console.error(`[Worker] Cleanup error:`, e.message);
    }
  }
}

app.listen(PORT, () => {
  console.log(`\n🚀 Zenira Backend running on http://localhost:${PORT}`);
  console.log(`   Health: GET  http://localhost:${PORT}/health`);
  console.log(`   Render: POST http://localhost:${PORT}/api/render\n`);
});
