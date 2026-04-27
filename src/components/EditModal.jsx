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
  const [speed, setSpeed] = useState('1x');
  const [crop, setCrop] = useState('9:16');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      speed,
      crop,
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
          <div className={styles.modalHeader} style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
            <span className={styles.stepBadge}>Langkah 2</span>
            <h3 className={styles.modalTitle} style={{ margin: '8px 0 4px 0' }}>
              Potong & Sesuaikan
            </h3>
            <p className={styles.stepHelper} style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
              Pilih bagian terbaik dan sesuaikan klip "{selectedClip.title}"
            </p>
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Tutup" style={{ position: 'absolute', top: 0, right: 0 }}>
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
              <button
                className={styles.previewPlayBtn}
                onClick={() => setIsPlaying(p => !p)}
                aria-label={isPlaying ? 'Jeda' : 'Putar'}
              >
                {isPlaying ? '⏸ Jeda' : '▶ Putar'}
              </button>
              <div className={styles.liveLabel}>Preview Langsung</div>
            </div>

            {/* Start Time Slider */}
            <div className={styles.sliderSection}>
              <label className={styles.sliderLabel}>
                Waktu Mulai <span className={styles.timeValue}>{formatTimestamp(startTime)}</span>
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
                Waktu Selesai <span className={styles.timeValue}>{formatTimestamp(endTime)}</span>
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
              <label className={styles.captionLabel}>Gaya Caption</label>
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

            {/* Advanced Settings */}
            <div className={styles.advancedSection}>
              <button 
                className={styles.advancedToggle} 
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span>⚙️ Pengaturan Lanjutan</span>
                <span className={styles.toggleIcon}>{showAdvanced ? '▲' : '▼'}</span>
              </button>
              
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div 
                    className={styles.advancedContent}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className={styles.advancedGrid}>
                      <div className={styles.advControl}>
                        <label>Kecepatan</label>
                        <select value={speed} onChange={e => setSpeed(e.target.value)}>
                          <option value="0.5x">0.5x (Lambat)</option>
                          <option value="1x">1x (Normal)</option>
                          <option value="1.5x">1.5x (Cepat)</option>
                          <option value="2x">2x (Sangat Cepat)</option>
                        </select>
                      </div>
                      <div className={styles.advControl}>
                        <label>Rasio (Crop)</label>
                        <select value={crop} onChange={e => setCrop(e.target.value)}>
                          <option value="9:16">9:16 (TikTok/Reels)</option>
                          <option value="16:9">16:9 (YouTube)</option>
                          <option value="1:1">1:1 (Instagram Post)</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button className={styles.cancelBtn} onClick={handleClose}>
              Batal
            </button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
              {isSaving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
