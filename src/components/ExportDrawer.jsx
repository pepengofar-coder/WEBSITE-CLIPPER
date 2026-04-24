import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { CAPTION_STYLES } from '../utils/mockData';
import { SUPPORTED_LANGUAGES } from '../utils/translation';
import Toast from './Toast';
import styles from './ExportDrawer.module.css';

export default function ExportDrawer() {
  const { exportingClip, actions, toast } = useAppState();
  const dispatch = useAppDispatch();

  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isGeneratingSubs, setIsGeneratingSubs] = useState(false);
  const [selectedLang, setSelectedLang] = useState('id');
  const [subtitleReady, setSubtitleReady] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Check if subtitle already stored on this clip
  useEffect(() => {
    if (exportingClip?.subtitleSrt) setSubtitleReady(true);
    else setSubtitleReady(false);
  }, [exportingClip]);

  // Simulate rendering progress
  useEffect(() => {
    if (!exportingClip) return;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setIsReady(true); return 100; }
        return Math.min(prev + (prev < 80 ? 2 : 1), 100);
      });
    }, 80);
    return () => clearInterval(interval);
  }, [exportingClip]);

  if (!exportingClip) return null;

  const handleClose = () => dispatch({ type: 'CLOSE_EXPORT' });
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) handleClose(); };

  const handleGenerateSubtitles = async () => {
    setIsGeneratingSubs(true);
    try {
      await actions.generateSubtitlesForClip(exportingClip, selectedLang);
      setSubtitleReady(true);
    } catch {
      // Toast error already dispatched in action
    } finally {
      setIsGeneratingSubs(false);
    }
  };

  const handleDownload = async () => {
    await actions.exportClip(exportingClip.id);

    const safeName = exportingClip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const zip = new JSZip();

    // Simulated MP4 (replace with real stream when backend is ready)
    const dummyMp4 = new Blob(
      [`Simulated 4K 9:16 MP4 content for: ${exportingClip.title}`],
      { type: 'video/mp4' }
    );
    zip.file(`${safeName}_4k.mp4`, dummyMp4);

    // SRT subtitle if available
    const srt = exportingClip.subtitleSrt;
    if (srt) {
      zip.file(`${safeName}_subtitles.srt`, srt);
    }

    // Clip metadata JSON
    const meta = {
      title: exportingClip.title,
      topic: exportingClip.topic,
      viralScore: exportingClip.viralScore,
      duration: exportingClip.duration,
      resolution: '2160x3840 (4K 9:16)',
      format: 'MP4 / H.264',
      captionStyle: exportingClip.captionStyle,
      transcript: exportingClip.transcript,
      generatedBy: 'ClipForge AI',
    };
    zip.file(`${safeName}_info.json`, JSON.stringify(meta, null, 2));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}_clipforge.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    handleClose();
  };

  const captionStyleName = CAPTION_STYLES.find(cs => cs.id === exportingClip.captionStyle)?.name || 'Bold Pop';

  return (
    <>
      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => actions.clearToast()}
        />
      )}

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
                📥 Export — "{exportingClip.title}"
              </h3>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
                ✕
              </button>
            </div>

            {/* Progress */}
            <div className={styles.progressSection}>
              <div className={styles.progressLabel}>
                <span>{isReady ? '✅ Ready to download!' : '⚙️ Preparing 4K render...'}</span>
                <span className={styles.progressPercent}>{progress}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Specs */}
            <div className={styles.specs}>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Resolution</span>
                <span className={styles.specValue}>2160 × 3840 (4K 9:16)</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Format</span>
                <span className={styles.specValue}>MP4 / H.264</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Captions</span>
                <span className={styles.specValue}>{captionStyleName}</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Duration</span>
                <span className={styles.specValue}>{exportingClip.duration}s</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Subtitle</span>
                <span className={`${styles.specValue} ${subtitleReady ? styles.specGreen : styles.specMuted}`}>
                  {subtitleReady ? `✅ ${exportingClip.subtitleLang?.toUpperCase() || 'DONE'}` : 'Not generated yet'}
                </span>
              </div>
            </div>

            {/* ── Subtitle Generator ── */}
            <div className={styles.subtitleSection}>
              <div className={styles.subtitleHeader}>
                <span className={styles.subtitleTitle}>🗒️ Auto-Subtitle Translation</span>
                <span className={styles.subtitleHint}>Generates an .srt file included in your download</span>
              </div>
              <div className={styles.subtitleControls}>
                <select
                  className={styles.langSelect}
                  value={selectedLang}
                  onChange={e => { setSelectedLang(e.target.value); setSubtitleReady(false); }}
                  id="subtitle-lang-select"
                >
                  {SUPPORTED_LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
                <button
                  className={`${styles.subtitleBtn} ${subtitleReady ? styles.subtitleDone : ''}`}
                  onClick={handleGenerateSubtitles}
                  disabled={isGeneratingSubs || !isReady}
                  id="generate-subtitles-btn"
                >
                  {isGeneratingSubs
                    ? '⏳ Translating...'
                    : subtitleReady
                      ? '✅ Re-generate'
                      : '🌐 Generate Subtitles'}
                </button>
              </div>
              {subtitleReady && (
                <motion.div
                  className={styles.srtPreview}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <span className={styles.srtLabel}>SRT Preview:</span>
                  <pre className={styles.srtContent}>
                    {(exportingClip.subtitleSrt || '').split('\n').slice(0, 9).join('\n')}
                    {'\n...'}
                  </pre>
                </motion.div>
              )}
            </div>

            {/* Download Button */}
            <button
              className={`${styles.downloadBtn} ${isReady ? styles.ready : styles.pending}`}
              onClick={isReady ? handleDownload : undefined}
              disabled={!isReady}
              id="export-download-btn"
            >
              {isReady
                ? subtitleReady
                  ? '⬇ Download MP4 + SRT (.zip)'
                  : '⬇ Download MP4 (.zip)'
                : '⏳ Rendering...'}
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
