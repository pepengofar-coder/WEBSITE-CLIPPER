import { useFeatureGate } from '../hooks/useFeatureGate';
import styles from './FeatureGate.module.css';

/**
 * Wraps children and shows a locked overlay if the feature is not available.
 * Does NOT just hide — shows a clear "upgrade" message.
 *
 * Props:
 *  - featureKey: string (e.g. 'export_1080p')
 *  - fallbackMessage?: string
 *  - children: ReactNode
 */
export default function FeatureGate({ featureKey, fallbackMessage, children }) {
  const { allowed, package: pkg, loading } = useFeatureGate(featureKey);

  if (loading) return null;

  if (!allowed) {
    return (
      <div className={styles.gateWrapper}>
        <div className={styles.lockedOverlay}>
          <div className={styles.lockedContent}>
            <span className={styles.lockIcon}>🔒</span>
            <p className={styles.lockText}>
              {fallbackMessage || `Fitur ini tersedia di paket yang lebih tinggi.`}
            </p>
            <span className={styles.lockBadge}>
              Paket Anda: <strong>{pkg?.charAt(0).toUpperCase() + pkg?.slice(1)}</strong>
            </span>
          </div>
        </div>
        <div className={styles.gatedChildren} aria-hidden="true">
          {children}
        </div>
      </div>
    );
  }

  return children;
}
