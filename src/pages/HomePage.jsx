import { motion } from 'framer-motion';
import LinkInput from '../components/LinkInput';
import PlatformBadges from '../components/PlatformBadges';
import FeatureCards from '../components/FeatureCards';
import styles from './HomePage.module.css';

export default function HomePage() {
  return (
    <div className={styles.homePage}>
      {/* Ambient background glows */}
      <div className={`${styles.bgGlow} ${styles.bgGlow1}`} />
      <div className={`${styles.bgGlow} ${styles.bgGlow2}`} />
      <div className={`${styles.bgGlow} ${styles.bgGlow3}`} />

      <div className={styles.content}>
        {/* Hero */}
        <motion.div
          className={styles.heroSection}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <span className={styles.badge}>✨ Generator Klip Bertenaga AI</span>
          <h1 className={styles.heroTitle}>
            Ubah Video Apapun Jadi{' '}
            <span className={styles.heroTitleGradient}>Klip Pendek Viral</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Tempel link. Dapatkan klip siap scroll yang dioptimalkan untuk TikTok, Reels &amp; YouTube Shorts — siap dalam hitungan detik.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          className={styles.inputSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <LinkInput />
          <PlatformBadges />
        </motion.div>

        {/* Features */}
        <FeatureCards />

        {/* Footer */}
        <div className={styles.footer}>
          <span>© 2026 ClipForge</span>
          <span>•</span>
          <a href="#privacy">Privasi</a>
          <span>•</span>
          <a href="#terms">Ketentuan</a>
        </div>
      </div>
    </div>
  );
}
