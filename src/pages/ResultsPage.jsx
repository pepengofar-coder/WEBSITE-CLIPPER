import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { exportMp4, triggerDownload } from '../utils/apiClient';
import ClipCard from '../components/ClipCard';
import EditModal from '../components/EditModal';
import ExportDrawer from '../components/ExportDrawer';
import Toast from '../components/Toast';
import styles from './ResultsPage.module.css';

export default function ResultsPage() {
  const { clips, source, sourceInfo, currentUrl, isEditModalOpen, isExportDrawerOpen, toast, actions } = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isExportingAll, setIsExportingAll] = useState(false);

  useEffect(() => {
    if (!isEditModalOpen && !isExportDrawerOpen) {
      document.body.style.overflow = '';
    }
  }, [isEditModalOpen, isExportDrawerOpen]);

  const handleNewClip = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  // Export all clips sequentially
  const handleDownloadAll = async () => {
    if (isExportingAll || !clips.length) return;

    setIsExportingAll(true);
    dispatch({ type: 'SET_TOAST', payload: { message: '⏳ Mengekspor semua klip...', type: 'loading' } });

    let successCount = 0;
    let failCount = 0;

    for (const clip of clips) {
      const clipSourceUrl = clip.sourceUrl || clip.webpageUrl || sourceInfo?.sourceUrl || sourceInfo?.webpageUrl || currentUrl;

      try {
        const result = await exportMp4({
          sourceUrl: clipSourceUrl,
          title: clip.title,
          startTime: clip.startTime || 0,
          endTime: clip.endTime || 0,
          quality: '720p',
        });

        triggerDownload(result.downloadUrl, result.filename);
        successCount++;

        // Small delay between downloads to avoid browser blocking
        await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        console.error(`[DownloadAll] Failed for clip "${clip.title}":`, err);
        failCount++;
      }
    }

    setIsExportingAll(false);

    if (failCount === 0) {
      dispatch({ type: 'SET_TOAST', payload: { message: `✅ ${successCount} klip berhasil diekspor!`, type: 'success' } });
    } else {
      dispatch({ type: 'SET_TOAST', payload: { message: `⚠️ ${successCount} berhasil, ${failCount} gagal.`, type: 'error' } });
    }
  };

  if (!clips || clips.length === 0) {
    return (
      <div className={styles.resultsPage}>
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎬</div>
            <h3>Belum ada klip yang dibuat</h3>
            <p>Tempel link video di halaman utama untuk memulai.</p>
            <button
              className={`${styles.headerBtn} ${styles.newClipBtn}`}
              onClick={handleNewClip}
              style={{ marginTop: '16px', display: 'inline-flex' }}
            >
              ← Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sortedClips = [...clips].sort((a, b) => b.viralScore - a.viralScore);

  return (
    <div className={styles.resultsPage}>
      <div className={styles.bgGlow} />

      <div className={styles.content}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className={styles.headerLeft}>
            <h2 className={styles.headerTitle}>
              🎉 Ditemukan <span className={styles.clipCount}>{clips.length} Momen Viral</span>!
            </h2>
            {source && (
              <p className={styles.sourceTitle}>
                Sumber: "{source.title}"
                {source.uploader && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · {source.uploader}</span>}
              </p>
            )}
          </div>
          <div className={styles.headerActions}>
            <button
              className={`${styles.headerBtn} ${styles.newClipBtn}`}
              onClick={handleNewClip}
            >
              ← Klip Baru
            </button>
            <button
              className={`${styles.headerBtn} ${styles.downloadAllBtn}`}
              onClick={handleDownloadAll}
              disabled={isExportingAll}
            >
              {isExportingAll ? '⏳ Mengekspor...' : '⬇ Unduh Semua'}
            </button>
          </div>
        </motion.div>

        {/* Clip Grid */}
        <div className={styles.clipGrid}>
          {sortedClips.map((clip, i) => (
            <ClipCard key={clip.id} clip={clip} index={i} />
          ))}
        </div>
      </div>

      {/* Modals / Drawers */}
      {isEditModalOpen && <EditModal />}
      {isExportDrawerOpen && <ExportDrawer />}

      {/* Toast (for download-all feedback) */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDone={() => actions.clearToast()}
        />
      )}
    </div>
  );
}
