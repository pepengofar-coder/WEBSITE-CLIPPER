import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { CAPTION_STYLES } from '../utils/mockData';
import { SUPPORTED_LANGUAGES, SOURCE_LANGUAGES } from '../utils/translation';
import { generateViralMeta, generateClipLink } from '../utils/viralMeta';
import Toast from './Toast';
import styles from './ExportDrawer.module.css';

export default function ExportDrawer() {
  const { exportingClip, currentUrl, actions, toast } = useAppState();
  const dispatch = useAppDispatch();

  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isGeneratingSubs, setIsGeneratingSubs] = useState(false);
  const [selectedLang, setSelectedLang] = useState('id');
  const [sourceLang, setSourceLang] = useState('en');
  const [subtitleReady, setSubtitleReady] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (exportingClip?.subtitleSrt) setSubtitleReady(true);
    else setSubtitleReady(false);
  }, [exportingClip]);

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

  const viralMeta = generateViralMeta(exportingClip);
  const clipLink = generateClipLink(currentUrl, exportingClip.startTime);

  const handleClose = () => dispatch({ type: 'CLOSE_EXPORT' });
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) handleClose(); };

  const handleGenerateSubtitles = async () => {
    setIsGeneratingSubs(true);
    try {
      await actions.generateSubtitlesForClip(exportingClip, selectedLang, sourceLang);
      setSubtitleReady(true);
    } catch {
      // Toast error already dispatched
    } finally {
      setIsGeneratingSubs(false);
    }
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(viralMeta.caption);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = viralMeta.caption;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(clipLink);
      dispatch({ type: 'SET_TOAST', payload: { message: '✅ Link klip tersalin!', type: 'success' } });
    } catch {}
  };

  const handleDownload = async () => {
    await actions.exportClip(exportingClip.id);

    const safeName = exportingClip.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const zip = new JSZip();

    // SRT subtitle if available
    const srt = exportingClip.subtitleSrt;
    if (srt) {
      zip.file(`${safeName}_subtitles.srt`, srt);
    }

    // Viral caption (ready to paste)
    zip.file(`${safeName}_caption.txt`, viralMeta.caption);

    // Clip metadata JSON
    const meta = {
      judul: exportingClip.title,
      topik: exportingClip.topic,
      skorViral: exportingClip.viralScore,
      durasi: `${exportingClip.duration} detik`,
      resolusi: '2160x3840 (4K 9:16)',
      format: 'MP4 / H.264',
      gayaCaption: exportingClip.captionStyle,
      transkrip: exportingClip.transcript,
      linkKlip: clipLink,
      hookCaption: viralMeta.hook,
      deskripsi: viralMeta.description,
      hashtag: viralMeta.hashtagString,
      captionLengkap: viralMeta.caption,
      dibuatOleh: 'ClipForge AI',
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
                📥 Ekspor — "{exportingClip.title}"
              </h3>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Tutup">
                ✕
              </button>
            </div>

            {/* Progress */}
            <div className={styles.progressSection}>
              <div className={styles.progressLabel}>
                <span>{isReady ? '✅ Siap diunduh!' : '⚙️ Menyiapkan render 4K...'}</span>
                <span className={styles.progressPercent}>{progress}%</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Specs */}
            <div className={styles.specs}>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Resolusi</span>
                <span className={styles.specValue}>2160 × 3840 (4K 9:16)</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Format</span>
                <span className={styles.specValue}>MP4 / H.264</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Caption</span>
                <span className={styles.specValue}>{captionStyleName}</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Durasi</span>
                <span className={styles.specValue}>{exportingClip.duration} detik</span>
              </div>
              <div className={styles.specRow}>
                <span className={styles.specLabel}>Subtitle</span>
                <span className={`${styles.specValue} ${subtitleReady ? styles.specGreen : styles.specMuted}`}>
                  {subtitleReady ? `✅ ${exportingClip.subtitleLang?.toUpperCase() || 'SELESAI'}` : 'Belum dibuat'}
                </span>
              </div>
            </div>

            {/* ── Caption Siap Posting ── */}
            <div className={styles.subtitleSection}>
              <div className={styles.subtitleHeader}>
                <span className={styles.subtitleTitle}>📝 Caption Siap Posting (FYP)</span>
                <span className={styles.subtitleHint}>Judul, deskripsi & hashtag siap copas</span>
              </div>
              <div className={styles.srtPreview} style={{ opacity: 1, height: 'auto', marginTop: '8px' }}>
                <pre className={styles.srtContent} style={{ whiteSpace: 'pre-wrap', fontSize: '0.82rem' }}>
                  {viralMeta.caption}
                </pre>
              </div>
              <div className={styles.subtitleControls} style={{ marginTop: '8px' }}>
                <button
                  className={`${styles.subtitleBtn} ${captionCopied ? styles.subtitleDone : ''}`}
                  onClick={handleCopyCaption}
                  id="copy-caption-btn"
                >
                  {captionCopied ? '✅ Tersalin!' : '📋 Salin Caption'}
                </button>
                {clipLink && (
                  <button
                    className={styles.subtitleBtn}
                    onClick={handleCopyLink}
                    id="copy-link-btn"
                  >
                    🔗 Salin Link Klip
                  </button>
                )}
              </div>
            </div>

            {/* ── Subtitle Generator ── */}
            <div className={styles.subtitleSection}>
              <div className={styles.subtitleHeader}>
                <span className={styles.subtitleTitle}>🗒️ Terjemahan Subtitle Otomatis</span>
                <span className={styles.subtitleHint}>Buat file .srt yang disertakan dalam unduhan</span>
              </div>
              <div className={styles.subtitleControls}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Bahasa Sumber
                  </label>
                  <select
                    className={styles.langSelect}
                    value={sourceLang}
                    onChange={e => setSourceLang(e.target.value)}
                    id="source-lang-select"
                  >
                    {SOURCE_LANGUAGES.map(l => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '18px', color: 'var(--text-muted)' }}>→</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Bahasa Tujuan
                  </label>
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
                </div>
                <button
                  className={`${styles.subtitleBtn} ${subtitleReady ? styles.subtitleDone : ''}`}
                  onClick={handleGenerateSubtitles}
                  disabled={isGeneratingSubs || !isReady}
                  id="generate-subtitles-btn"
                  style={{ alignSelf: 'flex-end' }}
                >
                  {isGeneratingSubs
                    ? '⏳ Menerjemahkan...'
                    : subtitleReady
                      ? '✅ Buat Ulang'
                      : '🌐 Buat Subtitle'}
                </button>
              </div>
              {subtitleReady && (
                <motion.div
                  className={styles.srtPreview}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <span className={styles.srtLabel}>Preview SRT:</span>
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
                  ? '⬇ Unduh Caption + SRT (.zip)'
                  : '⬇ Unduh Caption (.zip)'
                : '⏳ Memproses...'}
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
