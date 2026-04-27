import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { CAPTION_STYLES } from '../utils/mockData';
import { SUPPORTED_LANGUAGES, SOURCE_LANGUAGES } from '../utils/translation';
import { generateViralMeta, generateClipLink } from '../utils/viralMeta';
import { exportMp4, triggerDownload } from '../utils/apiClient';
import { downloadBlob } from '../utils/videoProcessor';
import Toast from './Toast';
import styles from './ExportDrawer.module.css';

export default function ExportDrawer() {
  const { exportingClip, currentUrl, sourceInfo, actions, toast } = useAppState();
  const dispatch = useAppDispatch();

  const [isReady, setIsReady] = useState(false);
  const [isGeneratingSubs, setIsGeneratingSubs] = useState(false);
  const [selectedLang, setSelectedLang] = useState('id');
  const [sourceLang, setSourceLang] = useState('en');
  const [subtitleReady, setSubtitleReady] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);

  // Export state (backend-based)
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [quality, setQuality] = useState('720p');
  const [fps, setFps] = useState('30');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Simulated render progress for metadata readiness
  const [renderProgress, setRenderProgress] = useState(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (exportingClip?.subtitleSrt) setSubtitleReady(true);
    else setSubtitleReady(false);
  }, [exportingClip]);

  // Simulate metadata render progress
  useEffect(() => {
    if (!exportingClip) return;
    const interval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) { clearInterval(interval); setIsReady(true); return 100; }
        return Math.min(prev + (prev < 80 ? 3 : 1), 100);
      });
    }, 60);
    return () => clearInterval(interval);
  }, [exportingClip]);

  if (!exportingClip) return null;

  const viralMeta = generateViralMeta(exportingClip);
  const clipLink = generateClipLink(currentUrl, exportingClip.startTime);

  // Determine the source URL for export
  const clipSourceUrl = exportingClip.sourceUrl || exportingClip.webpageUrl || sourceInfo?.sourceUrl || sourceInfo?.webpageUrl || currentUrl;

  const handleClose = () => dispatch({ type: 'CLOSE_EXPORT' });
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) handleClose(); };

  const handleGenerateSubtitles = async () => {
    setIsGeneratingSubs(true);
    try {
      await actions.generateSubtitlesForClip(exportingClip, selectedLang, sourceLang);
      setSubtitleReady(true);
    } catch {} finally {
      setIsGeneratingSubs(false);
    }
  };

  const handleCopyCaption = async () => {
    try { await navigator.clipboard.writeText(viralMeta.caption); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = viralMeta.caption;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(clipLink); }
    catch {}
    dispatch({ type: 'SET_TOAST', payload: { message: '✅ Link klip tersalin!', type: 'success' } });
  };

  const [downloadUrl, setDownloadUrl] = useState(null);

  // ── Main export handler: 1-click backend download ──
  const handleExportMP4 = async () => {
    if (!clipSourceUrl) {
      setExportError('Source URL tidak ditemukan. Silakan kembali dan paste link ulang.');
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);
    setDownloadUrl(null);

    console.log('[Export] request payload:', {
      sourceUrl: clipSourceUrl,
      title: exportingClip.title,
      startTime: exportingClip.startTime,
      endTime: exportingClip.endTime,
      quality,
      fps,
      subtitleLang: selectedLang,
      withSubtitles: subtitleReady,
    });

    try {
      const result = await exportMp4({
        sourceUrl: clipSourceUrl,
        title: exportingClip.title,
        startTime: exportingClip.startTime || 0,
        endTime: exportingClip.endTime || 0,
        quality,
        fps,
        withSubtitles: subtitleReady,
        subtitleLang: selectedLang,
      });

      console.log('[Export] server response:', result);
      console.log('[Export] downloadUrl:', result.downloadUrl);

      // Trigger download immediately using triggerDownload
      triggerDownload(result.downloadUrl, result.filename || 'Zenira-output.mp4');

      await actions.exportClip(exportingClip.id);
      
      // Update states
      setExportSuccess(true);
      setIsExporting(false);
      setDownloadUrl(result.downloadUrl);
      dispatch({ type: 'SET_TOAST', payload: { message: '✅ MP4 berhasil dibuat!', type: 'success' } });
      
    } catch (err) {
      console.error('[ExportDrawer] ❌ Export failed:', err);
      setExportError(err.message || 'Gagal mengekspor video.');
      setIsExporting(false);
      dispatch({ type: 'SET_TOAST', payload: { message: `❌ Export gagal: ${err.message}`, type: 'error' } });
    }
  };

  // ── Download metadata package (without video) ──
  const handleDownloadMeta = async () => {
    try {
      await actions.exportClip(exportingClip.id);
    } catch {}

    const safeName = (exportingClip.title || 'Zenira-output')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase()
      .substring(0, 40);
    const zip = new JSZip();

    if (exportingClip.subtitleSrt) {
      zip.file(`${safeName}_subtitles.srt`, exportingClip.subtitleSrt);
    }
    zip.file(`${safeName}_caption.txt`, viralMeta.caption);
    zip.file(`${safeName}_info.json`, JSON.stringify({
      judul: exportingClip.title,
      topik: exportingClip.topic,
      skorViral: exportingClip.viralScore,
      durasi: `${exportingClip.duration} detik`,
      format: 'MP4 / H.264',
      gayaCaption: exportingClip.captionStyle,
      transkrip: exportingClip.transcript,
      linkKlip: clipLink,
      hookCaption: viralMeta.hook,
      deskripsi: viralMeta.description,
      hashtag: viralMeta.hashtagString,
      captionLengkap: viralMeta.caption,
      sourceUrl: clipSourceUrl,
      sourceTitle: exportingClip.sourceTitle,
      platform: exportingClip.platform,
      dibuatOleh: 'Zenira AI',
    }, null, 2));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${safeName}_Zenira.zip`);
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
            <div className={styles.drawerHeader} style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative' }}>
              <span className={styles.stepBadge}>Langkah 3</span>
              <h3 className={styles.drawerTitle} style={{ margin: '8px 0 4px 0' }}>
                Ekspor & Download
              </h3>
              <p className={styles.stepHelper} style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                Pilih format dan unduh klip "{exportingClip.title}"
              </p>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Tutup" style={{ position: 'absolute', top: 16, right: 16 }}>✕</button>
            </div>

            {/* Scrollable body */}
            <div className={styles.drawerBody}>

              {/* Specs */}
              <div className={styles.specs}>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Format</span>
                  <span className={styles.specValue}>MP4 / H.264 + AAC</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Resolusi</span>
                  <span className={styles.specValue}>1080 × 1920 (9:16)</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Caption</span>
                  <span className={styles.specValue}>{captionStyleName}</span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Durasi</span>
                  <span className={styles.specValue}>{exportingClip.duration} detik</span>
                </div>
                {exportingClip.sourceTitle && (
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>Sumber</span>
                    <span className={styles.specValue} style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exportingClip.sourceTitle}
                    </span>
                  </div>
                )}
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
                    <button className={styles.subtitleBtn} onClick={handleCopyLink} id="copy-link-btn">
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
                  <div className={styles.langGroup}>
                    <label className={styles.langLabel}>Bahasa Sumber</label>
                    <select className={styles.langSelect} value={sourceLang} onChange={e => setSourceLang(e.target.value)} id="source-lang-select">
                      {SOURCE_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                  </div>
                  <div className={styles.langArrow}>→</div>
                  <div className={styles.langGroup}>
                    <label className={styles.langLabel}>Bahasa Tujuan</label>
                    <select className={styles.langSelect} value={selectedLang} onChange={e => { setSelectedLang(e.target.value); setSubtitleReady(false); }} id="subtitle-lang-select">
                      {SUPPORTED_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                  </div>
                  <button
                    className={`${styles.subtitleBtn} ${subtitleReady ? styles.subtitleDone : ''}`}
                    onClick={handleGenerateSubtitles}
                    disabled={isGeneratingSubs || !isReady}
                    id="generate-subtitles-btn"
                    style={{ alignSelf: 'flex-end' }}
                  >
                    {isGeneratingSubs ? '⏳ Menerjemahkan...' : subtitleReady ? '✅ Buat Ulang' : '🌐 Buat Subtitle'}
                  </button>
                </div>
                {subtitleReady && (
                  <motion.div className={styles.srtPreview} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <span className={styles.srtLabel}>Preview SRT:</span>
                    <pre className={styles.srtContent}>
                      {(exportingClip.subtitleSrt || '').split('\n').slice(0, 9).join('\n')}{'\n...'}
                    </pre>
                  </motion.div>
                )}
              </div>

              {/* ── Download MP4 Section (Backend-based) ── */}
              <div className={styles.subtitleSection}>
                <div className={styles.subtitleHeader}>
                  <span className={styles.subtitleTitle}>🎬 Download Video MP4</span>
                  <span className={styles.subtitleHint}>
                    Server mengunduh dan memproses video secara otomatis. Tidak perlu upload ulang.
                  </span>
                </div>

                {/* Quality selector */}
                <div className={styles.subtitleControls} style={{ marginBottom: '4px' }}>
                  <div className={styles.langGroup}>
                    <label className={styles.langLabel}>Kualitas Resolusi</label>
                    <select className={styles.langSelect} value={quality} onChange={e => setQuality(e.target.value)} id="quality-select">
                      <option value="720p">720p (Cepat, Ringan)</option>
                      <option value="1080p">1080p (HD, Jernih)</option>
                    </select>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className={styles.advancedSection} style={{ marginBottom: '16px', marginTop: '8px' }}>
                  <button 
                    className={styles.advancedToggle} 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    <span>⚙️ Pengaturan Lanjutan (FPS)</span>
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
                            <label className={styles.langLabel}>Frame Rate (FPS)</label>
                            <select className={styles.langSelect} value={fps} onChange={e => setFps(e.target.value)}>
                              <option value="30">30 FPS (Standar)</option>
                              <option value="60">60 FPS (Sangat Mulus)</option>
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Exporting state */}
                {isExporting && (
                  <div className={styles.videoProgressWrap}>
                    <div className={styles.progressLabel}>
                      <span>⏳ Sedang membuat MP4...</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: '100%', animation: 'indeterminate 1.5s ease-in-out infinite' }} />
                    </div>
                    <p className={styles.progressHint}>
                      Server sedang mengunduh dan memproses video. Ini bisa memakan waktu 30 detik - 2 menit.
                    </p>
                  </div>
                )}

                {/* Success state */}
                {exportSuccess && !isExporting && (
                  <div className={styles.successBox}>
                    ✅ MP4 berhasil dibuat dan diunduh! Cek folder Downloads Anda.
                  </div>
                )}

                {/* Error display */}
                {exportError && (
                  <div className={styles.errorBox}>
                    ❌ {exportError}
                  </div>
                )}

                {/* Main download button */}
                <button
                  className={`${styles.downloadBtn} ${isReady && !isExporting ? styles.ready : styles.pending}`}
                  onClick={isReady && !isExporting ? handleExportMP4 : undefined}
                  disabled={!isReady || isExporting}
                  id="process-video-btn"
                >
                  {isExporting
                    ? '⏳ Memproses di server...'
                    : exportSuccess
                      ? '🔄 Render Ulang MP4'
                      : '🎬 Download MP4'}
                </button>
                
                {exportSuccess && downloadUrl && (
                  <a
                    href={downloadUrl}
                    className={`${styles.downloadBtn} ${styles.readyAlt}`}
                    style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '8px' }}
                    download
                  >
                    ⬇️ Download Lagi (Fallback)
                  </a>
                )}
              </div>

              {/* Quick download metadata (tanpa video) */}
              <button
                className={`${styles.downloadBtn} ${isReady ? styles.readyAlt : styles.pending}`}
                onClick={isReady ? handleDownloadMeta : undefined}
                disabled={!isReady}
                id="export-download-btn"
              >
                {isReady
                  ? '📦 Unduh Caption + SRT (.zip)'
                  : '⏳ Mempersiapkan…'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
