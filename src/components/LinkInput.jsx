import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { detectPlatform } from '../utils/mockData';
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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

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
  const abortController = useRef(null);

  const platform = detectPlatform(url);

  // Call backend /api/check-url to validate URL with yt-dlp
  const validateUrl = useCallback(async (inputUrl) => {
    if (!inputUrl || !inputUrl.startsWith('http')) {
      setSourceInfo(null);
      return;
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setIsChecking(true);
    setError('');
    setSourceInfo(null);

    try {
      const resp = await fetch(`${BACKEND_URL}/api/check-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl }),
        signal: abortController.current.signal,
      });

      const data = await resp.json();

      if (!resp.ok || !data.ok) {
        setSourceInfo(null);
        setError(data.error || 'Link tidak bisa diproses. Pastikan link valid dan video dapat diakses publik.');
        return;
      }

      setSourceInfo(data);
      setError('');
    } catch (err) {
      if (err.name === 'AbortError') return; // Ignore aborted requests
      
      // Fallback to client-side validation if backend is unavailable
      console.warn('[LinkInput] Backend unreachable, using client-side validation:', err.message);
      const detectedPlatform = detectPlatform(inputUrl);
      if (detectedPlatform) {
        setSourceInfo({
          ok: true,
          isSupported: true,
          platform: detectedPlatform,
          platformIcon: PLATFORM_ICONS[detectedPlatform] || '🌐',
          title: 'Video',
          duration: 0,
          thumbnail: null,
          webpageUrl: inputUrl,
          sourceUrl: inputUrl,
          uploader: null,
          _fallback: true, // flag that metadata is not real
        });
        setError('');
      } else {
        setSourceInfo(null);
        setError('Tidak bisa terhubung ke server. Pastikan backend berjalan.');
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setUrl(val);
    if (error) setError('');

    // Debounce: validate 800ms after user stops typing
    clearTimeout(checkTimer.current);
    if (val.startsWith('http')) {
      checkTimer.current = setTimeout(() => validateUrl(val), 800);
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
          <span>🔍 Mengecek link via yt-dlp...</span>
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
              {sourceInfo._fallback && <span style={{ fontSize: '0.7rem', opacity: 0.6 }}> (offline)</span>}
            </span>
            <span className={styles.sourceTitle}>{sourceInfo.title}</span>
            <span className={styles.sourceMeta}>
              {sourceInfo.duration > 0 && <>⏱ {formatDurationHMS(sourceInfo.duration)}</>}
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
