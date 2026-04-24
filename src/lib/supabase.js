import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =============================================
// Jobs API
// =============================================

/**
 * Create a new processing job
 */
export async function createJob(url, platform) {
  const { data, error } = await supabase
    .from('cf_jobs')
    .insert({ url, platform, status: 'processing' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update job status
 */
export async function updateJobStatus(jobId, status, sourceTitle = null, totalClips = null) {
  const updates = { status };
  if (sourceTitle) updates.source_title = sourceTitle;
  if (totalClips !== null) updates.total_clips = totalClips;

  const { data, error } = await supabase
    .from('cf_jobs')
    .update(updates)
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get a specific job by ID
 */
export async function getJob(jobId) {
  const { data, error } = await supabase
    .from('cf_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get recent jobs (last 20)
 */
export async function getRecentJobs() {
  const { data, error } = await supabase
    .from('cf_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}

// =============================================
// Clips API
// =============================================

/**
 * Save multiple clips for a job
 */
export async function saveClips(jobId, clips) {
  const clipsToInsert = clips.map(clip => ({
    job_id: jobId,
    title: clip.title,
    topic: clip.topic,
    viral_score: clip.viralScore,
    duration: clip.duration,
    start_time: clip.startTime,
    end_time: clip.endTime,
    caption_style: clip.captionStyle || 'bold-pop',
    transcript: clip.transcript,
    status: 'ready',
  }));

  const { data, error } = await supabase
    .from('cf_clips')
    .insert(clipsToInsert)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Get all clips for a job, sorted by viral score
 */
export async function getClipsByJob(jobId) {
  const { data, error } = await supabase
    .from('cf_clips')
    .select('*')
    .eq('job_id', jobId)
    .order('viral_score', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Update a clip (edit start/end time, caption style, etc.)
 */
export async function updateClip(clipId, updates) {
  // Map camelCase to snake_case for DB
  const dbUpdates = {};
  if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
  if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime;
  if (updates.captionStyle !== undefined) dbUpdates.caption_style = updates.captionStyle;
  if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  // Subtitle fields
  if (updates.subtitle_srt !== undefined) dbUpdates.subtitle_srt = updates.subtitle_srt;
  if (updates.subtitle_lang !== undefined) dbUpdates.subtitle_lang = updates.subtitle_lang;

  const { data, error } = await supabase
    .from('cf_clips')
    .update(dbUpdates)
    .eq('id', clipId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark clip as exported
 */
export async function markClipExported(clipId) {
  return updateClip(clipId, { status: 'exported' });
}

// =============================================
// Helpers: Convert DB rows to app format
// =============================================

/**
 * Convert a DB clip row (snake_case) to app format (camelCase)
 */
export function dbClipToApp(dbClip) {
  return {
    id: dbClip.id,
    jobId: dbClip.job_id,
    title: dbClip.title,
    topic: dbClip.topic,
    viralScore: dbClip.viral_score,
    duration: dbClip.duration,
    startTime: dbClip.start_time,
    endTime: dbClip.end_time,
    captionStyle: dbClip.caption_style,
    transcript: dbClip.transcript,
    status: dbClip.status,
    subtitle_srt: dbClip.subtitle_srt,
    subtitleLang: dbClip.subtitle_lang,
    createdAt: dbClip.created_at,
  };
}

/**
 * Convert a DB job row to app format
 */
export function dbJobToApp(dbJob) {
  return {
    id: dbJob.id,
    url: dbJob.url,
    platform: dbJob.platform,
    status: dbJob.status,
    sourceTitle: dbJob.source_title,
    totalClips: dbJob.total_clips,
    createdAt: dbJob.created_at,
  };
}
