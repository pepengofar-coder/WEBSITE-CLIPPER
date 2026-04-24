import { useState } from 'react';
import { motion } from 'framer-motion';
import ViralBadge from './ViralBadge';
import VideoPreview from './VideoPreview';
import { formatDuration } from '../utils/mockData';
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
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        {/* Caption overlay */}
        <div className={`${styles.captionPreview} ${CAPTION_STYLE_CLASS[clip.captionStyle] || styles.boldPop}`}>
          {clip.transcript?.substring(0, 40)}…
        </div>

        {/* Subtitle indicator */}
        {clip.subtitle_srt && (
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
        <div className={styles.cardMeta}>
          <span className={styles.duration}>⏱ {formatDuration(clip.duration)}</span>
        </div>
        <div className={styles.actions}>
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
            ⬇ Export
          </button>
        </div>
      </div>
    </motion.div>
  );
}
