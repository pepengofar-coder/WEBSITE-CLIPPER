import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { detectPlatform } from '../utils/mockData';
import { checkUrl } from '../utils/apiClient';
import styles from './LinkInput.module.css';

const PLATFORM_ICONS = {
  youtube: '▶️',
  tiktok: '🎵',
  instagram: '📸',
  facebook: '👤',
  twitter: '🐦',
  vimeo: '🎬',
  twitch: '🎮',
  generic: '🌐',
};

function formatDurationHMS(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LinkInput() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [sourceInfo, setSourceInfo] = useState(null); // validated video metadata
  const { actions } = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const checkTimer = useRef(null);

  const platform = detectPlatform(url);

  // Debounced URL validation via backend
  const validateUrl = useCallback(async (inputUrl) => {
    if (!inputUrl || !inputUrl.startsWith('http')) {
      setSourceInfo(null);
      return;
    }

    setIsChecking(true);
    setError('');
    setSourceInfo(null);

    try {
      const result = await checkUrl(inputUrl);

      if (result.ok && result.isSupported) {
        setSourceInfo(result);
        setError('');
        console.log('[LinkInput] URL valid:', result.title, `(${result.duration}s)`);
      } else {
        setSourceInfo(null);
        setError(result.error || 'Link tidak bisa diproses.');
      }
    } catch (err) {
      setSourceInfo(null);
      // Only show error if it's not a network issue (backend might not be running)
      if (err.name === 'AbortError') {
        setError('Timeout — server terlalu lama merespons.');
      } else {
        // Backend might be down — fallback to client-side detection only
        console.warn('[LinkInput] Backend check failed:', err.message);
        setError('Backend server is not running. Start backend or configure VITE_API_BASE_URL.');
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    if (error) setError('');

    // Debounce: validate 600ms after user stops typing
    clearTimeout(checkTimer.current);
    if (val.startsWith('http')) {
      checkTimer.current = setTimeout(() => validateUrl(val), 600);
    } else {
      setSourceInfo(null);
    }
  };

  const handlePaste = (e) => {
    // Validate immediately on paste
    setTimeout(() => {
      const pastedUrl = e.target.value;
      if (pastedUrl.startsWith('http')) {
        clearTimeout(checkTimer.current);
        validateUrl(pastedUrl);
      }
    }, 50);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Silakan tempel link video');
      return;
    }
    if (!url.startsWith('http')) {
      setError('Masukkan URL yang valid');
      return;
    }

    setError('');
    setIsSubmitting(true);

    // Store source info in state for later use
    dispatch({
      type: 'SET_URL',
      payload: { url, platform: sourceInfo?.platform || platform || 'generic' },
    });

    if (sourceInfo) {
      dispatch({ type: 'SET_SOURCE_INFO', payload: sourceInfo });
    }

    const job = await actions.startProcessing(url, sourceInfo?.platform || platform || 'generic');

    if (job) {
      navigate('/processing');
    } else {
      setError('Gagal memulai proses. Silakan coba lagi.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <span className={styles.stepBadge}>Langkah 1</span>
        <h2 className={styles.stepTitle}>Pilih Video</h2>
        <p className={styles.stepHelper}>Upload video Anda atau paste link YouTube/TikTok</p>
      </div>
      <form className={styles.linkInputWrapper} onSubmit={handleSubmit}>
        <div className={styles.inputContainer}>
        {platform ? (
          <span className={styles.platformIcon}>
            {PLATFORM_ICONS[platform] || PLATFORM_ICONS.generic}
          </span>
        ) : (
          <span className={styles.linkIcon}>🔗</span>
        )}
        <input
          id="link-input"
          className={styles.input}
          type="url"
          value={url}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder="Paste link YouTube, TikTok, Instagram, Facebook, X/Twitter, Vimeo, atau Twitch..."
          autoComplete="off"
          autoFocus
        />
        <button
          id="generate-btn"
          type="submit"
          className={styles.generateBtn}
          disabled={!url.trim() || isSubmitting || isChecking}
        >
          <span>{isSubmitting ? 'Memproses...' : isChecking ? 'Mengecek...' : 'Buat Klip'}</span>
          <span className={styles.btnIcon}>→</span>
        </button>
      </div>

      {/* Checking indicator */}
      {isChecking && (
        <div className={styles.checkingBar}>
          <div className={styles.checkingFill} />
          <span>🔍 Mengecek link...</span>
        </div>
      )}

      {/* Video preview card (shown after successful validation) */}
      {sourceInfo && !isChecking && (
        <div className={styles.sourceCard}>
          {sourceInfo.thumbnail && (
            <img
              className={styles.sourceThumb}
              src={sourceInfo.thumbnail}
              alt={sourceInfo.title}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <div className={styles.sourceDetails}>
            <span className={styles.sourcePlatform}>
              {PLATFORM_ICONS[sourceInfo.platform] || '🌐'} {sourceInfo.platform?.toUpperCase()}
            </span>
            <span className={styles.sourceTitle}>{sourceInfo.title}</span>
            <span className={styles.sourceMeta}>
              ⏱ {formatDurationHMS(sourceInfo.duration)}
              {sourceInfo.uploader && <> · {sourceInfo.uploader}</>}
            </span>
          </div>
          <span className={styles.sourceCheck}>✅</span>
        </div>
      )}

      {error && <p className={styles.errorMsg}>{error}</p>}
      </form>
    </div>
  );
}
