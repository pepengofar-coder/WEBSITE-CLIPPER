import { motion } from 'framer-motion';
import { Zap, Type, Smartphone, Clock } from 'lucide-react';
import styles from './LandingSections.module.css';

const benefits = [
  {
    icon: Zap,
    title: 'Auto Detect Momen Viral',
    description: 'AI menganalisis transkip, intonasi & visual untuk menemukan hook terbaik secara otomatis.',
    gradient: 'linear-gradient(135deg, #ff6b35 0%, #f43f5e 100%)',
    glow: 'rgba(255, 107, 53, 0.2)',
  },
  {
    icon: Type,
    title: 'Auto Subtitle',
    description: 'Subtitle animasi berwarna yang dioptimalkan untuk algoritma sosial media. Support terjemahan.',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    glow: 'rgba(124, 58, 237, 0.2)',
  },
  {
    icon: Smartphone,
    title: 'Format 9:16 Siap Upload',
    description: 'Auto-reframe ke format vertikal untuk TikTok, Instagram Reels & YouTube Shorts.',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    glow: 'rgba(59, 130, 246, 0.2)',
  },
  {
    icon: Clock,
    title: 'Hemat Waktu Editing',
    description: 'Dari berjam-jam jadi hitungan menit. Fokus buat konten, biar AI yang edit.',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    glow: 'rgba(16, 185, 129, 0.2)',
  },
];

export default function BenefitsSection() {
  return (
    <section className={styles.benefitsSection} id="benefits">
      <motion.div
        className={styles.sectionHeader}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
      >
        <span className={styles.sectionBadge}>Keunggulan</span>
        <h2 className={styles.sectionTitle}>
          Kenapa <span className={styles.gradientText}>Zenira</span>?
        </h2>
        <p className={styles.sectionSubtitle}>
          Toolkit lengkap untuk content creator yang ingin scale up produksi konten tanpa effort ekstra.
        </p>
      </motion.div>

      <div className={styles.benefitsGrid}>
        {benefits.map((benefit, i) => (
          <motion.div
            key={benefit.title}
            className={styles.benefitCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            style={{ '--benefit-glow': benefit.glow }}
          >
            <div
              className={styles.benefitIcon}
              style={{ background: benefit.gradient }}
            >
              <benefit.icon size={24} strokeWidth={1.8} color="#fff" />
            </div>
            <h3 className={styles.benefitTitle}>{benefit.title}</h3>
            <p className={styles.benefitDesc}>{benefit.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
