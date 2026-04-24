import { motion } from 'framer-motion';

const platforms = [
  { id: 'youtube', label: 'YouTube', icon: '▶️', color: '#FF0000' },
  { id: 'spotify', label: 'Spotify', icon: '🎵', color: '#1DB954' },
  { id: 'podcast', label: 'Podcast', icon: '🎙️', color: '#9B59B6' },
];

export default function PlatformBadges() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      flexWrap: 'wrap',
    }}>
      {platforms.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--glass-bg)',
            border: 'var(--border-card)',
            fontSize: '0.85rem',
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
          <span style={{ fontSize: '1rem' }}>{p.icon}</span>
          <span>{p.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
