import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import ViralBadge from './ViralBadge';
import { formatDuration } from '../utils/mockData';
import { useAppDispatch } from '../context/AppContext';
import styles from './ClipCard.module.css';

const CAPTION_STYLE_CLASS = {
  'bold-pop': styles.boldPop,
  'neon-glow': styles.neonGlow,
  'minimal': styles.minimal,
};

export default function ClipCard({ clip, index }) {
  const dispatch = useAppDispatch();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const handleEdit = () => {
    dispatch({ type: 'OPEN_EDIT_MODAL', payload: clip });
  };

  const handleDownload = () => {
    dispatch({ type: 'OPEN_EXPORT', payload: clip });
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
    >
      {/* 9:16 Preview */}
      <div className={styles.previewArea}>
        <video 
          ref={videoRef}
          src="https://www.w3schools.com/html/mov_bbb.mp4" 
          loop 
          muted 
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
        />
        <div className={styles.previewGradient}>
          <button 
            className={styles.playBtn} 
            onClick={togglePlay} 
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
          >
            {isPlaying ? '⏸️' : '▶'}
          </button>
        </div>
        {/* Caption preview */}
        <div className={`${styles.captionPreview} ${CAPTION_STYLE_CLASS[clip.captionStyle] || styles.boldPop}`}>
          {clip.transcript?.substring(0, 40)}...
        </div>
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
            ⬇ Download
          </button>
        </div>
      </div>
    </motion.div>
  );
}
