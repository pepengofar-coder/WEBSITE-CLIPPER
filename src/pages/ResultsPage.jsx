import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppState, useAppDispatch } from '../context/AppContext';
import ClipCard from '../components/ClipCard';
import EditModal from '../components/EditModal';
import ExportDrawer from '../components/ExportDrawer';
import styles from './ResultsPage.module.css';

export default function ResultsPage() {
  const { clips, source, isEditModalOpen, isExportDrawerOpen } = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isEditModalOpen && !isExportDrawerOpen) {
      document.body.style.overflow = '';
    }
  }, [isEditModalOpen, isExportDrawerOpen]);

  const handleNewClip = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
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
              <p className={styles.sourceTitle}>Sumber: "{source.title}"</p>
            )}
          </div>
          <div className={styles.headerActions}>
            <button
              className={`${styles.headerBtn} ${styles.newClipBtn}`}
              onClick={handleNewClip}
            >
              ← Klip Baru
            </button>
            <button className={`${styles.headerBtn} ${styles.downloadAllBtn}`}>
              ⬇ Unduh Semua
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
    </div>
  );
}
