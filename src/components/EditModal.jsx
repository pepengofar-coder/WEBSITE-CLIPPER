import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { formatTimestamp, CAPTION_STYLES } from '../utils/mockData';
import VideoPreview from './VideoPreview';
import styles from './EditModal.module.css';

export default function EditModal() {
  const { selectedClip, currentUrl, actions } = useAppState();
  const dispatch = useAppDispatch();

  const [startTime, setStartTime] = useState(selectedClip?.startTime || 0);
  const [endTime, setEndTime] = useState(selectedClip?.endTime || 60);
  const [captionStyle, setCaptionStyle] = useState(selectedClip?.captionStyle || 'bold-pop');
  const [isPlaying, setIsPlaying] = useState(true); // autoplay in editor
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!selectedClip) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const updates = {
      startTime,
      endTime,
      captionStyle,
      duration: endTime - startTime,
    };
    await actions.saveClipEdit(selectedClip.id, updates);
    setIsSaving(false);
  };

  const handleClose = () => {
    dispatch({ type: 'CLOSE_EDIT_MODAL' });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const captionStyleClass = {
    'bold-pop': styles.boldPop,
    'neon-glow': styles.neonGlow,
    'minimal': styles.minimal,
  };

  const minRange = Math.max(0, selectedClip.startTime - 30);
  const maxRange = selectedClip.endTime + 30;

  return (
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        onClick={handleOverlayClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Header */}
          <div className={styles.modalHeader}>
            <h3 className={styles.modalTitle}>
              ✏️ Edit Clip — "{selectedClip.title}"
            </h3>
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
              ✕
            </button>
          </div>

          {/* Body */}
          <div className={styles.modalBody}>
            {/* Preview — 9:16 video */}
            <div className={styles.previewContainer}>
              <VideoPreview
                url={currentUrl}
                isPlaying={isPlaying}
                startTime={startTime}
                style={{ borderRadius: '12px', overflow: 'hidden' }}
              />
              {/* Play/pause toggle over the preview */}
              <button
                className={styles.previewPlayBtn}
                onClick={() => setIsPlaying(p => !p)}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <div className={styles.liveLabel}>Live Preview</div>
            </div>

            {/* Start Time Slider */}
            <div className={styles.sliderSection}>
              <label className={styles.sliderLabel}>
                Start Time <span className={styles.timeValue}>{formatTimestamp(startTime)}</span>
              </label>
              <input
                type="range"
                className={styles.slider}
                min={minRange}
                max={endTime - 5}
                value={startTime}
                onChange={(e) => setStartTime(Number(e.target.value))}
                id="start-time-slider"
              />
            </div>

            {/* End Time Slider */}
            <div className={styles.sliderSection}>
              <label className={styles.sliderLabel}>
                End Time <span className={styles.timeValue}>{formatTimestamp(endTime)}</span>
              </label>
              <input
                type="range"
                className={styles.slider}
                min={startTime + 5}
                max={maxRange}
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value))}
                id="end-time-slider"
              />
            </div>

            {/* Caption Style Picker */}
            <div className={styles.captionSection}>
              <label className={styles.captionLabel}>Caption Style</label>
              <div className={styles.captionOptions}>
                {CAPTION_STYLES.map((cs) => (
                  <button
                    key={cs.id}
                    className={`${styles.captionOption} ${captionStyle === cs.id ? styles.active : ''}`}
                    onClick={() => setCaptionStyle(cs.id)}
                    id={`caption-style-${cs.id}`}
                  >
                    <div className={`${styles.captionPreviewText} ${captionStyleClass[cs.id]}`}>
                      {cs.preview}
                    </div>
                    <div className={styles.captionOptionName}>{cs.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button className={styles.cancelBtn} onClick={handleClose}>
              Cancel
            </button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
              {isSaving ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
