import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import JSZip from 'jszip';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { CAPTION_STYLES } from '../utils/mockData';
import { SUPPORTED_LANGUAGES, SOURCE_LANGUAGES } from '../utils/translation';
import { generateViralMeta, generateClipLink } from '../utils/viralMeta';
import { processVideoWithCaptions, downloadBlob, isFFmpegSupported } from '../utils/videoProcessor';
import Toast from './Toast';
import styles from './ExportDrawer.module.css';

export default function ExportDrawer() {
  const { exportingClip, currentUrl, actions, toast } = useAppState();
  const dispatch = useAppDispatch();

  const [isReady, setIsReady] = useState(false);
  const [isGeneratingSubs, setIsGeneratingSubs] = useState(false);
  const [selectedLang, setSelectedLang] = useState('id');
  const [sourceLang, setSourceLang] = useState('en');
  const [subtitleReady, setSubtitleReady] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);

  // Video upload & processing
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [exportError, setExportError] = useState(null);
  const [exportPhase, setExportPhase] = useState(''); // Current phase label
  const fileInputRef = useRef(null);

  // Simulated render progress for metadata readiness
  const [renderProgress, setRenderProgress] = useState(0);

  // Check browser compatibility
  const ffmpegOk = isFFmpegSupported();

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

  // ── File upload handlers ──
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedFile(file);
      setExportError(null);
    } else if (file) {
      setExportError('File harus berformat video (MP4, MOV, WebM, AVI).');
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedFile(file);
      setExportError(null);
    } else if (file) {
      setExportError('File harus berformat video.');
    }
  };

  // ── Process & Download MP4 ──
  const handleProcessVideo = async () => {
    if (!uploadedFile) return;

    setIsProcessingVideo(true);
    setVideoProgress(0);
    setExportError(null);

    // Phase labels for UX
    const phaseLabels = {
      0: '📦 Memuat FFmpeg…',
      15: '📦 FFmpeg siap',
      18: '📂 Membaca file video…',
      25: '📂 File video dimuat',
      30: '⚙️ Memulai encoding H.264…',
      90: '💾 Membaca output…',
      98: '🧹 Membersihkan…',
      100: '✅ Selesai!',
    };

    try {
      const srt = exportingClip.subtitleSrt || '';
      const mp4Blob = await processVideoWithCaptions(
        uploadedFile,
        srt,
        exportingClip.startTime || 0,
        exportingClip.endTime || 0,
        (progress) => {
          setVideoProgress(progress);
          // Find the closest phase label
          const keys = Object.keys(phaseLabels).map(Number).sort((a, b) => a - b);
          const key = keys.reverse().find(k => progress >= k) || 0;
          setExportPhase(phaseLabels[key]);
        }
      );

      // Validate the blob
      if (!mp4Blob || mp4Blob.size < 1000) {
        throw new Error('Output MP4 terlalu kecil — kemungkinan encoding gagal.');
      }

      const safeName = (exportingClip.title || 'clipforge-output')
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .substring(0, 40);
      downloadBlob(mp4Blob, `${safeName}_clipforge.mp4`);

      await actions.exportClip(exportingClip.id);
      dispatch({ type: 'SET_TOAST', payload: { message: '✅ Video MP4 berhasil diunduh!', type: 'success' } });
    } catch (err) {
      console.error('Video processing failed:', err);
      setExportError(err.message || 'Terjadi kesalahan saat memproses video.');
      dispatch({ type: 'SET_TOAST', payload: { message: `❌ Export gagal: ${err.message}`, type: 'error' } });
    } finally {
      setIsProcessingVideo(false);
      setExportPhase('');
    }
  };

  // ── Download metadata package (without video) ──
  const handleDownloadMeta = async () => {
    try {
      await actions.exportClip(exportingClip.id);
    } catch {}

    const safeName = (exportingClip.title || 'clipforge-output')
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
      dibuatOleh: 'ClipForge AI',
    }, null, 2));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(zipBlob, `${safeName}_clipforge.zip`);
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
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Tutup">✕</button>
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
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Subtitle</span>
                  <span className={`${styles.specValue} ${subtitleReady ? styles.specGreen : styles.specMuted}`}>
                    {subtitleReady ? `✅ ${exportingClip.subtitleLang?.toUpperCase() || 'SELESAI'}` : 'Belum dibuat'}
                  </span>
                </div>
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>FFmpeg</span>
                  <span className={`${styles.specValue} ${ffmpegOk ? styles.specGreen : ''}`}>
                    {ffmpegOk ? '✅ Didukung' : '❌ Tidak didukung'}
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

              {/* ── Upload Video + Process MP4 ── */}
              <div className={styles.subtitleSection}>
                <div className={styles.subtitleHeader}>
                  <span className={styles.subtitleTitle}>🎬 Proses & Unduh Video MP4</span>
                  <span className={styles.subtitleHint}>
                    Upload file video → FFmpeg memproses di browser → unduh MP4 dengan caption tertanam
                  </span>
                </div>

                {/* Browser compatibility warning */}
                {!ffmpegOk && (
                  <div className={styles.errorBox}>
                    ⚠️ Browser Anda tidak mendukung WebAssembly. Gunakan Chrome, Firefox, atau Edge versi terbaru.
                  </div>
                )}

                {/* Upload zone */}
                <div
                  className={`${styles.uploadZone} ${isDragging ? styles.uploadDragging : ''} ${uploadedFile ? styles.uploadDone : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm,video/avi,video/x-matroska,video/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="video-upload-input"
                  />
                  {uploadedFile ? (
                    <div className={styles.uploadInfo}>
                      <span className={styles.uploadIcon}>✅</span>
                      <span className={styles.uploadName}>{uploadedFile.name}</span>
                      <span className={styles.uploadSize}>({(uploadedFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                      <span className={styles.uploadHint}>Klik lagi untuk ganti file</span>
                    </div>
                  ) : (
                    <div className={styles.uploadInfo}>
                      <span className={styles.uploadIcon}>📁</span>
                      <span>Seret file video ke sini atau <strong>klik untuk pilih</strong></span>
                      <span className={styles.uploadHint}>MP4, MOV, AVI, WebM — Maks 500MB</span>
                    </div>
                  )}
                </div>

                {/* Processing progress */}
                {isProcessingVideo && (
                  <div className={styles.videoProgressWrap}>
                    <div className={styles.progressLabel}>
                      <span>{exportPhase || '⚙️ Memproses video…'}</span>
                      <span className={styles.progressPercent}>{videoProgress}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${videoProgress}%` }} />
                    </div>
                    <p className={styles.progressHint}>
                      Proses encoding berjalan di browser. Jangan tutup tab ini.
                    </p>
                  </div>
                )}

                {/* Error display */}
                {exportError && (
                  <div className={styles.errorBox}>
                    ❌ {exportError}
                  </div>
                )}

                {/* Process MP4 button */}
                <button
                  className={`${styles.downloadBtn} ${uploadedFile && isReady && ffmpegOk ? styles.ready : styles.pending}`}
                  onClick={uploadedFile && isReady && ffmpegOk ? handleProcessVideo : undefined}
                  disabled={!uploadedFile || !isReady || isProcessingVideo || !ffmpegOk}
                  id="process-video-btn"
                >
                  {isProcessingVideo
                    ? `⏳ Memproses… ${videoProgress}%`
                    : !ffmpegOk
                      ? '⚠️ FFmpeg tidak didukung browser ini'
                      : uploadedFile
                        ? '🎬 Proses & Unduh MP4 dengan Caption'
                        : '📁 Upload video dulu untuk proses MP4'}
                </button>
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
