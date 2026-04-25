import { useState } from 'react';
import { motion } from 'framer-motion';
import ViralBadge from './ViralBadge';
import VideoPreview from './VideoPreview';
import { formatDuration } from '../utils/mockData';
import { generateViralMeta, generateClipLink } from '../utils/viralMeta';
import { generateThumbnail, downloadThumbnail } from '../utils/thumbnailGenerator';
import { useAppState, useAppDispatch } from '../context/AppContext';
import styles from './ClipCard.module.css';

const CAPTION_STYLE_CLASS = {
  'bold-pop': styles.boldPop,
  'neon-glow': styles.neonGlow,
  'minimal': styles.minimal,
};

export default function ClipCard({ clip, index }) {
  const { currentUrl } = useAppState();
  const dispatch = useAppDispatch();
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingThumb, setGeneratingThumb] = useState(false);

  const viralMeta = generateViralMeta(clip);

  const handleEdit = (e) => {
    e.stopPropagation();
    dispatch({ type: 'OPEN_EDIT_MODAL', payload: clip });
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    dispatch({ type: 'OPEN_EXPORT', payload: clip });
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    setIsPlaying(prev => !prev);
  };

  const handleCopyCaption = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(viralMeta.caption);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = viralMeta.caption;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleThumbnail = async (e) => {
    e.stopPropagation();
    setGeneratingThumb(true);
    try {
      const blob = await generateThumbnail(clip);
      const safeName = clip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      downloadThumbnail(blob, `${safeName}_thumbnail.png`);
    } catch (err) {
      console.error('Thumbnail failed:', err);
    }
    setGeneratingThumb(false);
  };

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      {/* 9:16 Preview */}
      <div className={styles.previewArea} onClick={togglePlay}>
        <VideoPreview
          url={currentUrl}
          isPlaying={isPlaying}
          startTime={clip.startTime}
        />

        {/* Gradient overlay + play button */}
        <div className={styles.previewGradient}>
          <button
            className={styles.playBtn}
            aria-label={isPlaying ? 'Jeda preview' : 'Putar preview'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        {/* Caption overlay */}
        <div className={`${styles.captionPreview} ${CAPTION_STYLE_CLASS[clip.captionStyle] || styles.boldPop}`}>
          {clip.transcript?.substring(0, 40)}…
        </div>

        {/* Subtitle indicator */}
        {clip.subtitleSrt && (
          <div className={styles.subtitleBadge}>
            🗒️ {clip.subtitleLang?.toUpperCase() || 'SUB'}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className={styles.cardInfo}>
        <div className={styles.cardHeader}>
          <ViralBadge score={clip.viralScore} />
          <span className={styles.topic}>{clip.topic}</span>
        </div>
        <h3 className={styles.cardTitle}>{clip.title}</h3>

        {/* Hashtags */}
        <div className={styles.hashtagRow}>
          {viralMeta.hashtags.slice(0, 5).map((tag, i) => (
            <span key={i} className={styles.hashtag}>{tag}</span>
          ))}
        </div>

        <div className={styles.cardMeta}>
          <span className={styles.duration}>⏱ {formatDuration(clip.duration)}</span>
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${styles.copyBtn}`}
            onClick={handleCopyCaption}
            id={`copy-caption-${clip.id}`}
          >
            {copied ? '✅ Tersalin!' : '📋 Caption'}
          </button>
          <button
            className={`${styles.actionBtn} ${styles.thumbBtn}`}
            onClick={handleThumbnail}
            disabled={generatingThumb}
            id={`thumb-${clip.id}`}
          >
            {generatingThumb ? '⏳' : '📸 Thumb'}
          </button>
          <button
            className={`${styles.actionBtn} ${styles.editBtn}`}
            onClick={handleEdit}
            id={`edit-clip-${clip.id}`}
          >
            ✏️ Edit
          </button>
          <button
            className={`${styles.actionBtn} ${styles.downloadBtn}`}
            onClick={handleDownload}
            id={`download-clip-${clip.id}`}
          >
            ⬇ Ekspor
          </button>
        </div>
      </div>
    </motion.div>
  );
}
