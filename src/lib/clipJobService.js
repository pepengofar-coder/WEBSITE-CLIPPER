import { supabase } from './supabase';

export async function uploadRawVideo(file, userId) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data.path;
}

export async function createRenderJob(jobData) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    throw new Error('Not authenticated');
  }

  // Use local backend if configured, else fallback to Edge Function
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const endpoint = backendUrl 
    ? `${backendUrl}/api/render` 
    : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-clip-job`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(jobData)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create render job');
  }

  return data;
}

export function subscribeToJob(jobId, onUpdate) {
  const subscription = supabase
    .channel(`job-${jobId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'render_jobs',
        filter: `id=eq.${jobId}`,
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

export async function getJob(jobId) {
  const { data, error } = await supabase
    .from('render_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) throw error;
  return data;
}
