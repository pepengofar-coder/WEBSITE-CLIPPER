import { motion } from 'framer-motion';
import { Play, Sparkles } from 'lucide-react';
import styles from './LandingSections.module.css';

export default function HeroSection() {
  const scrollToDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className={styles.heroSection} id="hero">
      {/* Floating particles */}
      <div className={styles.particles}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{
              '--delay': `${i * 0.8}s`,
              '--x': `${15 + i * 14}%`,
              '--duration': `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      <motion.div
        className={styles.heroContent}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.span
          className={styles.heroBadge}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Sparkles size={14} />
          Generator Klip Bertenaga AI
        </motion.span>

        <h1 className={styles.heroTitle}>
          Pemotong Video Online Gratis{' '}
          <span className={styles.heroGradientText}>(Tanpa Watermark)</span>
        </h1>

        <p className={styles.heroSubtitle}>
          Potong video dalam hitungan detik — tanpa perlu daftar.
          Tempel link video atau upload, dan dapatkan klip Anda dengan instan.
        </p>

        <motion.div
          className={styles.heroCtas}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <a href="#hero-input" className={styles.ctaPrimary}>
            <Sparkles size={18} />
            Coba Gratis Sekarang
          </a>
          <button onClick={scrollToDemo} className={styles.ctaSecondary}>
            <Play size={16} />
            Lihat Demo
          </button>
        </motion.div>

        <motion.p
          className={styles.heroTrust}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          ✓ Tanpa watermark &nbsp;·&nbsp; ✓ Tanpa signup &nbsp;·&nbsp; ✓ Gratis sepenuhnya
        </motion.p>
      </motion.div>
    </section>
  );
}
