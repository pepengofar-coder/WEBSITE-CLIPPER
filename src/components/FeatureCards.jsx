import { motion } from 'framer-motion';
import styles from './FeatureCards.module.css';

const features = [
  {
    icon: '🤖',
    title: 'AI Viral Engine',
    description: 'Analyzes transcript and intonation to detect hook moments with the highest viral potential.',
  },
  {
    icon: '📐',
    title: 'Auto-Reframe 9:16',
    description: 'Automatically crops horizontal video to vertical format while keeping the speaker centered.',
  },
  {
    icon: '💬',
    title: 'Dynamic Auto-Caption',
    description: 'Bold, colorful animated subtitles optimized for TikTok, Reels, and YouTube Shorts algorithms.',
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
