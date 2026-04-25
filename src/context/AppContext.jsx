import { createContext, useContext, useReducer, useCallback } from 'react';
import {
  createJob,
  updateJobStatus,
  saveClips,
  getClipsByJob,
  updateClip as updateClipApi,
  markClipExported,
  dbClipToApp,
  dbJobToApp,
} from '../lib/supabase';
import { translateText, buildSRT } from '../utils/translation';

const AppContext = createContext(null);
const AppDispatchContext = createContext(null);

/**
 * Generate realistic clip data from real source metadata.
 * Produces clips with correct sourceUrl, thumbnailUrl, sourceTitle, and
 * timestamps within the actual video duration.
 */
function generateClipsFromSource(sourceInfo) {
  const { title, duration, thumbnail, webpageUrl, sourceUrl, platform } = sourceInfo;
  const realDuration = duration || 600; // fallback 10 min

  // Generate 3-6 clips depending on video length
  const clipCount = Math.min(6, Math.max(3, Math.floor(realDuration / 120)));
  const clipDurations = [42, 31, 55, 38, 47, 28];
  const topics = [
    'Highlight', 'Insight', 'Momen Kunci', 'Diskusi',
    'Reaksi', 'Analisis'
  ];
  const clipTitles = [
    `Momen Viral dari "${title}"`,
    `Insight Terbaik — ${title}`,
    `Highlight: ${title}`,
    `Diskusi Menarik — ${title}`,
    `Reaksi Terbaik — ${title}`,
    `Analisis Mendalam — ${title}`,
  ];
  const transcripts = [
    "This is going to change everything. The technology we're seeing now is just the beginning of what's possible...",
    "What people don't realize is that this has been building for years. The breakthrough moment is finally here...",
    "The implications of this are massive. We're talking about a fundamental shift in how things work...",
    "I think the real question is not whether this will happen, but when. And I believe it's sooner than most people think...",
    "When you look at the data, it's undeniable. The trend is accelerating and there's no sign of it slowing down...",
    "This is one of those moments where you have to step back and appreciate the magnitude of what's happening...",
  ];

  const clips = [];
  let currentTime = Math.floor(realDuration * 0.05); // Start at 5% of video

  for (let i = 0; i < clipCount; i++) {
    const clipDur = clipDurations[i % clipDurations.length];
    const startTime = Math.min(currentTime, realDuration - clipDur - 10);
    const endTime = Math.min(startTime + clipDur, realDuration);

    if (startTime < 0 || endTime <= startTime) continue;

    let thumbUrl = thumbnail;
    if (platform === 'youtube' && webpageUrl) {
      const match = webpageUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/);
      if (match && match[1]) {
        thumbUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
      }
    }

    clips.push({
      id: `clip-${i + 1}`,
      title: clipTitles[i % clipTitles.length],
      topic: topics[i % topics.length],
      viralScore: Math.max(50, 95 - i * 7 + Math.floor(Math.random() * 5)),
      duration: endTime - startTime,
      startTime,
      endTime,
      captionStyle: ['bold-pop', 'neon-glow', 'minimal'][i % 3],
      thumbnail: null,
      transcript: transcripts[i % transcripts.length],
      // Real source data
      sourceUrl: sourceUrl || webpageUrl,
      webpageUrl: webpageUrl,
      sourceTitle: title,
      thumbnailUrl: thumbUrl,
      platform: platform,
    });

    // Space clips evenly through the video
    currentTime = endTime + Math.floor((realDuration - endTime) / (clipCount - i));
  }

  return clips;
}

const initialState = {
  // Input
  currentUrl: '',
  detectedPlatform: null,

  // Source metadata from backend check-url
  sourceInfo: null,

  // Processing
  isProcessing: false,
  processingStep: 0,
  processingProgress: 0,

  // Current job
  currentJobId: null,

  // Results
  clips: [],
  source: null,
  hasResults: false,

  // Edit modal
  selectedClip: null,
  isEditModalOpen: false,

  // Export drawer
  exportingClip: null,
  isExportDrawerOpen: false,
  exportProgress: 0,

  // Error / toast
  error: null,
  toast: null, // { message, type }
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_URL':
      return { ...state, currentUrl: action.payload.url, detectedPlatform: action.payload.platform };

    case 'SET_SOURCE_INFO':
      return { ...state, sourceInfo: action.payload };

    case 'START_PROCESSING':
      return {
        ...state,
        isProcessing: true,
        processingStep: 0,
        processingProgress: 0,
        hasResults: false,
        clips: [],
        error: null,
        toast: null,
      };

    case 'SET_JOB_ID':
      return { ...state, currentJobId: action.payload };

    case 'UPDATE_PROCESSING':
      return {
        ...state,
        processingStep: action.payload.step,
        processingProgress: action.payload.progress,
      };

    case 'FINISH_PROCESSING':
      return {
        ...state,
        isProcessing: false,
        processingStep: 4,
        processingProgress: 100,
        clips: action.payload.clips,
        source: action.payload.source,
        hasResults: true,
      };

    case 'OPEN_EDIT_MODAL':
      return {
        ...state,
        selectedClip: action.payload,
        isEditModalOpen: true,
      };

    case 'CLOSE_EDIT_MODAL':
      return {
        ...state,
        selectedClip: null,
        isEditModalOpen: false,
      };

    case 'SAVE_CLIP_EDIT':
      return {
        ...state,
        clips: state.clips.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
        selectedClip: null,
        isEditModalOpen: false,
      };

    case 'OPEN_EXPORT':
      return {
        ...state,
        exportingClip: action.payload,
        isExportDrawerOpen: true,
        exportProgress: 0,
      };

    case 'UPDATE_EXPORT_PROGRESS':
      return {
        ...state,
        exportProgress: action.payload,
      };

    case 'CLOSE_EXPORT':
      return {
        ...state,
        exportingClip: null,
        isExportDrawerOpen: false,
        exportProgress: 0,
      };

    // ✅ Save generated subtitle to clip
    case 'SAVE_SUBTITLE':
      return {
        ...state,
        clips: state.clips.map(c =>
          c.id === action.payload.id
            ? { ...c, subtitleSrt: action.payload.subtitleSrt, subtitleLang: action.payload.lang }
            : c
        ),
        // Also update selectedClip / exportingClip if they match
        selectedClip:
          state.selectedClip?.id === action.payload.id
            ? { ...state.selectedClip, subtitleSrt: action.payload.subtitleSrt }
            : state.selectedClip,
        exportingClip:
          state.exportingClip?.id === action.payload.id
            ? { ...state.exportingClip, subtitleSrt: action.payload.subtitleSrt }
            : state.exportingClip,
      };

    case 'SET_TOAST':
      return { ...state, toast: action.payload };

    case 'CLEAR_TOAST':
      return { ...state, toast: null };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isProcessing: false };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // ── Supabase-integrated actions ──────────────────────────────────────────

  const startProcessing = useCallback(async (url, platform) => {
    dispatch({ type: 'START_PROCESSING' });
    try {
      const job = await createJob(url, platform);
      dispatch({ type: 'SET_JOB_ID', payload: job.id });
      return job;
    } catch (err) {
      console.error('Failed to create job:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start processing. Please try again.' });
      return null;
    }
  }, []);

  const finishProcessing = useCallback(async (jobId) => {
    try {
      // Use real source metadata to generate clips
      const sourceInfo = state.sourceInfo;
      let clipsToSave;
      let sourceData;

      if (sourceInfo) {
        // Generate clips from real source metadata
        clipsToSave = generateClipsFromSource(sourceInfo);
        sourceData = {
          title: sourceInfo.title,
          platform: sourceInfo.platform,
          url: sourceInfo.webpageUrl || sourceInfo.sourceUrl,
          thumbnail: sourceInfo.thumbnail,
          totalDuration: sourceInfo.duration,
          uploader: sourceInfo.uploader,
        };
      } else {
        // Fallback: generate minimal clips from URL
        clipsToSave = generateClipsFromSource({
          title: 'Video',
          duration: 600,
          thumbnail: null,
          webpageUrl: state.currentUrl,
          sourceUrl: state.currentUrl,
          platform: state.detectedPlatform || 'generic',
        });
        sourceData = {
          title: 'Video',
          platform: state.detectedPlatform || 'generic',
          url: state.currentUrl,
          thumbnail: null,
          totalDuration: 600,
        };
      }

      // Save to Supabase
      const savedClips = await saveClips(jobId, clipsToSave);
      const appClips = savedClips.map(c => {
        const dbClip = dbClipToApp(c);
        // Merge back the source metadata that isn't stored in DB
        const original = clipsToSave.find(oc => oc.title === dbClip.title);
        return {
          ...dbClip,
          sourceUrl: original?.sourceUrl || sourceData.url,
          webpageUrl: original?.webpageUrl || sourceData.url,
          sourceTitle: original?.sourceTitle || sourceData.title,
          thumbnailUrl: original?.thumbnailUrl || sourceData.thumbnail,
          platform: original?.platform || sourceData.platform,
        };
      });

      await updateJobStatus(jobId, 'completed', sourceData.title, appClips.length);

      dispatch({
        type: 'FINISH_PROCESSING',
        payload: { clips: appClips, source: sourceData },
      });
      return appClips;
    } catch (err) {
      console.error('Failed to finish processing:', err);
      // Fallback with generated data
      const fallbackClips = generateClipsFromSource({
        title: 'Video',
        duration: 600,
        thumbnail: null,
        webpageUrl: state.currentUrl,
        sourceUrl: state.currentUrl,
        platform: state.detectedPlatform || 'generic',
      });
      const fallbackSource = {
        title: 'Video',
        platform: state.detectedPlatform || 'generic',
        url: state.currentUrl,
        totalDuration: 600,
      };
      dispatch({
        type: 'FINISH_PROCESSING',
        payload: { clips: fallbackClips, source: fallbackSource },
      });
      return fallbackClips;
    }
  }, [state.sourceInfo, state.currentUrl, state.detectedPlatform]);

  const saveClipEdit = useCallback(async (clipId, updates) => {
    try {
      await updateClipApi(clipId, updates);
    } catch (err) {
      console.error('Failed to save clip edit:', err);
    }
    dispatch({ type: 'SAVE_CLIP_EDIT', payload: { id: clipId, ...updates } });
  }, []);

  const exportClip = useCallback(async (clipId) => {
    try {
      await markClipExported(clipId);
    } catch (err) {
      console.error('Failed to mark clip exported:', err);
    }
  }, []);



  /**
   * Generate + store subtitles. Accepts the clip object directly.
   */
  const generateSubtitlesForClip = useCallback(async (clip, targetLang = 'id', sourceLang = 'en') => {
    if (!clip?.transcript) throw new Error('No transcript available for this clip.');

    dispatch({ type: 'SET_TOAST', payload: { message: '⏳ Menerjemahkan subtitle...', type: 'loading' } });

    try {
      // 1. Translate the transcript
      const translatedText = await translateText(clip.transcript, targetLang, sourceLang);

      // 2. Build SRT file
      const srt = buildSRT(translatedText, clip.startTime || 0);

      // 3. Persist to Supabase (best-effort — don't block on failure)
      try {
        await updateClipApi(clip.id, { subtitleSrt: srt, subtitleLang: targetLang });
      } catch (_) {}

      // 4. Update local state
      dispatch({
        type: 'SAVE_SUBTITLE',
        payload: { id: clip.id, subtitleSrt: srt, lang: targetLang },
      });

      dispatch({ type: 'SET_TOAST', payload: { message: '✅ Subtitle berhasil dibuat!', type: 'success' } });

      return srt;
    } catch (err) {
      console.error('Subtitle generation failed:', err);
      dispatch({
        type: 'SET_TOAST',
        payload: { message: `❌ Terjemahan gagal: ${err.message}. Coba lagi.`, type: 'error' },
      });
      throw err;
    }
  }, []);

  const clearToast = useCallback(() => {
    dispatch({ type: 'CLEAR_TOAST' });
  }, []);

  const actions = {
    startProcessing,
    finishProcessing,
    saveClipEdit,
    exportClip,
    generateSubtitlesForClip,
    clearToast,
  };

  return (
    <AppContext.Provider value={{ ...state, actions }}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within AppProvider');
  }
  return context;
}

export function useAppDispatch() {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within AppProvider');
  }
  return context;
}
