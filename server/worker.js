import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, unlinkSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { trimVideo } from './lib/ffmpeg.js';

dotenv.config();

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TEMP_DIR = resolve(join(__dirname, 'temp'));
const OUTPUTS_DIR = resolve(join(__dirname, 'outputs'));

[TEMP_DIR, OUTPUTS_DIR].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

async function downloadFromStorage(bucket, path, destPath) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;
  
  const buffer = Buffer.from(await data.arrayBuffer());
  import('node:fs/promises').then(fs => fs.writeFile(destPath, buffer));
  return destPath;
}

async function uploadToStorage(bucket, path, sourcePath) {
  const fileData = readFileSync(sourcePath);
  const { data, error } = await supabase.storage.from(bucket).upload(path, fileData, {
    upsert: true,
    contentType: 'video/mp4'
  });
  if (error) throw error;
  return data.path;
}

async function processJob(job) {
  console.log(`[Worker] Starting job ${job.id}`);
  
  // Mark as processing
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
    await uploadToStorage('results', outputStoragePath, result.path);
    
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
    // Cleanup
    try {
      if (existsSync(tempInputPath)) unlinkSync(tempInputPath);
      if (existsSync(outputFilePath)) unlinkSync(outputFilePath);
    } catch (e) {
      console.error(`[Worker] Cleanup error:`, e.message);
    }
  }
}

async function pollJobs() {
  try {
    const { data: jobs, error } = await supabase
      .from('render_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('[Worker] Polling error:', error.message);
      return;
    }

    if (jobs && jobs.length > 0) {
      await processJob(jobs[0]);
    }
  } catch (err) {
    console.error('[Worker] Unexpected error during polling:', err);
  }
}

console.log("🚀 Render Worker Started");
console.log("Polling for pending jobs...");

// Poll every 5 seconds
setInterval(pollJobs, 5000);
