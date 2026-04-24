import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { CAPTION_STYLES } from '../utils/mockData';
import styles from './ExportDrawer.module.css';

export default function ExportDrawer() {
  const { exportingClip, actions } = useAppState();
  const dispatch = useAppDispatch();
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Simulate export rendering progress
  useEffect(() => {
    if (!exportingClip) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsReady(true);
          return 100;
        }
        const increment = prev < 80 ? 2 : 1;
        return Math.min(prev + increment, 100);
      });
    }, 80);

    return () => clearInterval(interval);
  }, [exportingClip]);

  if (!exportingClip) return null;

  const handleClose = () => {
    dispatch({ type: 'CLOSE_EXPORT' });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const handleDownload = async () => {
    // Mark as exported in Supabase
    await actions.exportClip(exportingClip.id);
    
    // Simulate real file download
    const dummyBlob = new Blob(['Simulated MP4 content'], { type: 'video/mp4' });
    const url = URL.createObjectURL(dummyBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportingClip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_clipforge.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    handleClose();
  };

  const captionStyleName = CAPTION_STYLES.find(cs => cs.id === exportingClip.captionStyle)?.name || 'Bold Pop';

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        onClick={handleOverlayClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className={styles.drawer}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className={styles.handle} />

          {/* Header */}
          <div className={styles.drawerHeader}>
            <h3 className={styles.drawerTitle}>
              📥 Exporting "{exportingClip.title}"
            </h3>
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
              ✕
            </button>
          </div>

          {/* Progress */}
          <div className={styles.progressSection}>
            <div className={styles.progressLabel}>
              <span>{isReady ? 'Ready to download!' : 'Rendering MP4...'}</span>
              <span className={styles.progressPercent}>{progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Specs */}
          <div className={styles.specs}>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Resolution</span>
              <span className={styles.specValue}>1080 × 1920 (9:16)</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Format</span>
              <span className={styles.specValue}>MP4 / H.264</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Captions</span>
              <span className={styles.specValue}>{captionStyleName} style</span>
            </div>
            <div className={styles.specRow}>
              <span className={styles.specLabel}>Duration</span>
              <span className={styles.specValue}>{exportingClip.duration}s</span>
            </div>
          </div>

          {/* Download Button */}
          <button
            className={`${styles.downloadBtn} ${isReady ? styles.ready : styles.pending}`}
            onClick={isReady ? handleDownload : undefined}
            disabled={!isReady}
            id="export-download-btn"
          >
            {isReady ? '⬇ Download MP4' : '⏳ Rendering...'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
