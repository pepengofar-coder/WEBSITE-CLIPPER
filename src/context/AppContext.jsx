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
import { MOCK_CLIPS, MOCK_SOURCE } from '../utils/mockData';
import { translateText, buildSRT } from '../utils/translation';

const AppContext = createContext(null);
const AppDispatchContext = createContext(null);

const initialState = {
  // Input
  currentUrl: '',
  detectedPlatform: null,

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
      const savedClips = await saveClips(jobId, MOCK_CLIPS);
      const appClips = savedClips.map(dbClipToApp);
      await updateJobStatus(jobId, 'completed', MOCK_SOURCE.title, appClips.length);
      dispatch({
        type: 'FINISH_PROCESSING',
        payload: { clips: appClips, source: { ...MOCK_SOURCE } },
      });
      return appClips;
    } catch (err) {
      console.error('Failed to finish processing:', err);
      dispatch({
        type: 'FINISH_PROCESSING',
        payload: { clips: MOCK_CLIPS, source: MOCK_SOURCE },
      });
      return MOCK_CLIPS;
    }
  }, []);

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
   * Generate + store subtitles for a clip.
   * @param {string} clipId
   * @param {string} targetLang - ISO language code (e.g. 'id', 'en')
   * @param {string} sourceLang - source language code (default: 'en')
   */
  const generateSubtitles = useCallback(async (clipId, targetLang = 'id', sourceLang = 'en') => {
    // Find clip in current state (snapshot via closure would be stale; use dispatch to read)
    // We'll use a ref-trick: pass the clip directly from the caller.
    // This function receives the clip object from ExportDrawer.
    throw new Error('Use generateSubtitlesForClip(clip, targetLang) instead.');
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
    generateSubtitles,
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
