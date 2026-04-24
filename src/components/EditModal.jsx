import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { formatTimestamp, CAPTION_STYLES } from '../utils/mockData';
import styles from './EditModal.module.css';

export default function EditModal() {
  const { selectedClip, actions } = useAppState();
  const dispatch = useAppDispatch();

  const [startTime, setStartTime] = useState(selectedClip?.startTime || 0);
  const [endTime, setEndTime] = useState(selectedClip?.endTime || 60);
  const [captionStyle, setCaptionStyle] = useState(selectedClip?.captionStyle || 'bold-pop');
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

    // Save to Supabase + local state
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

  const { currentUrl } = useAppState();
  const ytMatch = currentUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
  const ytId = ytMatch ? ytMatch[1] : null;

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
            {/* Preview */}
            <div className={styles.previewContainer} style={{ position: 'relative', overflow: 'hidden' }}>
              {ytId ? (
                <div style={{ width: '300%', height: '100%', position: 'absolute', left: '-100%', pointerEvents: 'none' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&controls=0&playlist=${ytId}`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="autoplay; encrypted-media"
                    title="YouTube preview"
                  />
                </div>
              ) : (
                <video 
                  src="https://www.w3schools.com/html/mov_bbb.mp4" 
                  loop 
                  muted 
                  autoPlay
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                />
              )}
              <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, textAlign: 'center', zIndex: 2 }}>
                <span className={styles.previewText} style={{ background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px' }}>Live Preview</span>
              </div>
            </div>

            {/* Start Time Slider */}
            <div className={styles.sliderSection}>
              <label className={styles.sliderLabel}>Start Time</label>
              <div className={styles.sliderRow}>
                <span className={styles.timeValue}>{formatTimestamp(startTime)}</span>
                <input
                  type="range"
                  className={styles.slider}
                  min={minRange}
                  max={endTime - 5}
                  value={startTime}
                  onChange={(e) => setStartTime(Number(e.target.value))}
                  id="start-time-slider"
                />
                <span className={styles.timeValue}>{formatTimestamp(endTime)}</span>
              </div>
            </div>

            {/* End Time Slider */}
            <div className={styles.sliderSection}>
              <label className={styles.sliderLabel}>End Time</label>
              <div className={styles.sliderRow}>
                <span className={styles.timeValue}>{formatTimestamp(startTime)}</span>
                <input
                  type="range"
                  className={styles.slider}
                  min={startTime + 5}
                  max={maxRange}
                  value={endTime}
                  onChange={(e) => setEndTime(Number(e.target.value))}
                  id="end-time-slider"
                />
                <span className={styles.timeValue}>{formatTimestamp(endTime)}</span>
              </div>
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
              {isSaving ? '⏳ Saving...' : '💾 Save'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
