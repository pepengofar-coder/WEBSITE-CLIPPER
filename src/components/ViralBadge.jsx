import { getViralLevel } from '../utils/mockData';

export default function ViralBadge({ score }) {
  const { emoji, label, tier } = getViralLevel(score);

  const tierStyles = {
    fire: {
      background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(244,63,94,0.15))',
      border: '1px solid rgba(255,107,53,0.3)',
      color: '#ff6b35',
    },
    hot: {
      background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.15))',
      border: '1px solid rgba(245,158,11,0.3)',
      color: '#f59e0b',
    },
    warm: {
      background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(6,182,212,0.15))',
      border: '1px solid rgba(59,130,246,0.3)',
      color: '#3b82f6',
    },
  };

  const style = tierStyles[tier];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.8rem',
        fontWeight: 700,
        fontFamily: 'var(--font-heading)',
        letterSpacing: '0.01em',
        ...style,
      }}
    >
      {emoji} {score}%
    </span>
  );
}
