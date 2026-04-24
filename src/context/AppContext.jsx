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

  // Error
  error: null,
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

  // Supabase-integrated actions
  const startProcessing = useCallback(async (url, platform) => {
    dispatch({ type: 'START_PROCESSING' });

    try {
      // 1. Create job in Supabase
      const job = await createJob(url, platform);
      dispatch({ type: 'SET_JOB_ID', payload: job.id });

      // 2. Simulate processing (in a real app, the backend does this)
      // The ProcessingPage handles the animation; we just need to save results at the end
      return job;
    } catch (err) {
      console.error('Failed to create job:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start processing. Please try again.' });
      return null;
    }
  }, []);

  const finishProcessing = useCallback(async (jobId) => {
    try {
      // 1. Save mock clips to Supabase
      const savedClips = await saveClips(jobId, MOCK_CLIPS);
      const appClips = savedClips.map(dbClipToApp);

      // 2. Update job status
      await updateJobStatus(jobId, 'completed', MOCK_SOURCE.title, appClips.length);

      // 3. Update local state
      dispatch({
        type: 'FINISH_PROCESSING',
        payload: {
          clips: appClips,
          source: { ...MOCK_SOURCE },
        },
      });

      return appClips;
    } catch (err) {
      console.error('Failed to finish processing:', err);
      // Fall back to local mock data
      dispatch({
        type: 'FINISH_PROCESSING',
        payload: {
          clips: MOCK_CLIPS,
          source: MOCK_SOURCE,
        },
      });
      return MOCK_CLIPS;
    }
  }, []);

  const saveClipEdit = useCallback(async (clipId, updates) => {
    try {
      // Save to Supabase
      await updateClipApi(clipId, updates);
    } catch (err) {
      console.error('Failed to save clip edit:', err);
      // Continue anyway — state is updated locally
    }

    dispatch({
      type: 'SAVE_CLIP_EDIT',
      payload: { id: clipId, ...updates },
    });
  }, []);

  const exportClip = useCallback(async (clipId) => {
    try {
      await markClipExported(clipId);
    } catch (err) {
      console.error('Failed to mark clip exported:', err);
    }
  }, []);

  const actions = {
    startProcessing,
    finishProcessing,
    saveClipEdit,
    exportClip,
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
