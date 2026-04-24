import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Toast notification component.
 * Usage: <Toast message="..." type="success|error|info" onDone={() => ...} />
 */
export default function Toast({ message, type = 'info', duration = 3500, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDone]);

  const colors = {
    success: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16,185,129,0.4)', icon: '✅' },
    error:   { bg: 'rgba(239, 68, 68, 0.15)',  border: 'rgba(239,68,68,0.4)',  icon: '❌' },
    info:    { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59,130,246,0.4)', icon: 'ℹ️' },
    loading: { bg: 'rgba(124, 58, 237, 0.15)', border: 'rgba(124,58,237,0.4)', icon: '⏳' },
  };

  const c = colors[type] || colors.info;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: c.bg,
            border: `1px solid ${c.border}`,
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem',
            color: '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            maxWidth: '420px',
            whiteSpace: 'pre-wrap',
          }}
          role="alert"
          aria-live="polite"
        >
          <span style={{ fontSize: '1.1rem' }}>{c.icon}</span>
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
