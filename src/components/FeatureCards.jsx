import { motion } from 'framer-motion';
import styles from './FeatureCards.module.css';

const features = [
  {
    icon: '🤖',
    title: 'Mesin Viral AI',
    description: 'Analisis transkrip dan intonasi untuk mendeteksi momen hook dengan potensi viral tertinggi.',
  },
  {
    icon: '📐',
    title: 'Auto-Reframe 9:16',
    description: 'Otomatis memotong video horizontal ke format vertikal dengan tetap menjaga speaker di tengah.',
  },
  {
    icon: '💬',
    title: 'Caption Dinamis Otomatis',
    description: 'Subtitle animasi berwarna yang dioptimalkan untuk algoritma TikTok, Reels, dan YouTube Shorts.',
  },
];

export default function FeatureCards() {
  return (
    <div className={styles.featureGrid} id="features">
      {features.map((feature, i) => (
        <motion.div
          key={feature.title}
          className={styles.featureCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 + i * 0.15, duration: 0.5 }}
        >
          <div className={styles.iconWrapper}>{feature.icon}</div>
          <h3 className={styles.featureTitle}>{feature.title}</h3>
          <p className={styles.featureDesc}>{feature.description}</p>
        </motion.div>
      ))}
    </div>
  );
}
