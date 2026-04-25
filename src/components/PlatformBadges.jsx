import { motion } from 'framer-motion';

const platforms = [
  { id: 'youtube', label: 'YouTube', icon: '▶️', color: '#FF0000' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: '#00F2EA' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: '#E4405F' },
  { id: 'facebook', label: 'Facebook', icon: '👤', color: '#1877F2' },
  { id: 'spotify', label: 'Spotify', icon: '🎧', color: '#1DB954' },
  { id: 'podcast', label: 'Podcast', icon: '🎙️', color: '#9B59B6' },
];

export default function PlatformBadges() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      flexWrap: 'wrap',
    }}>
      {platforms.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--glass-bg)',
            border: 'var(--border-card)',
            fontSize: '0.8rem',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            cursor: 'default',
            transition: 'all 0.25s ease',
          }}
          whileHover={{
            scale: 1.05,
            backgroundColor: 'rgba(255,255,255,0.08)',
            color: '#f1f1f5',
          }}
        >
          <span style={{ fontSize: '0.9rem' }}>{p.icon}</span>
          <span>{p.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
