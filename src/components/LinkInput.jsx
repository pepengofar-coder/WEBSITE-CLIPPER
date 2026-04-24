import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { detectPlatform } from '../utils/mockData';
import styles from './LinkInput.module.css';

const PLATFORM_ICONS = {
  youtube: '▶️',
  spotify: '🎵',
  'apple-podcast': '🎙️',
  podcast: '🎙️',
  generic: '🔗',
};

export default function LinkInput() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { actions } = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const platform = detectPlatform(url);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Silakan tempel link video atau podcast');
      return;
    }
    if (!url.startsWith('http')) {
      setError('Masukkan URL yang valid');
      return;
    }
    setError('');
    setIsSubmitting(true);

    dispatch({
      type: 'SET_URL',
      payload: { url, platform: platform || 'generic' },
    });

    const job = await actions.startProcessing(url, platform || 'generic');

    if (job) {
      navigate('/processing');
    } else {
      setError('Gagal memulai proses. Silakan coba lagi.');
    }
    setIsSubmitting(false);
  };

  const handleChange = (e) => {
    setUrl(e.target.value);
    if (error) setError('');
  };

  return (
    <form className={styles.linkInputWrapper} onSubmit={handleSubmit}>
      <div className={styles.inputContainer}>
        {platform ? (
          <span className={styles.platformIcon}>
            {PLATFORM_ICONS[platform]}
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
          placeholder="Tempel link YouTube, Spotify, atau Podcast..."
          autoComplete="off"
          autoFocus
        />
        <button
          id="generate-btn"
          type="submit"
          className={styles.generateBtn}
          disabled={!url.trim() || isSubmitting}
        >
          <span>{isSubmitting ? 'Memproses...' : 'Buat Klip'}</span>
          <span className={styles.btnIcon}>→</span>
        </button>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
    </form>
  );
}
