import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import styles from './LandingSections.module.css';

const PLAN_META = {
  basic: {
    name: 'Basic',
    price: '0',
    period: 'Selamanya',
    description: 'Mulai tanpa biaya, coba semua fitur dasar.',
    cta: 'Mulai Gratis',
    highlighted: false,
    gradient: null,
  },
  pro: {
    name: 'Pro',
    price: '149rb',
    period: '/bulan',
    description: 'Untuk creator serius yang butuh hasil profesional.',
    badge: 'Paling Populer',
    cta: 'Mulai Sekarang',
    highlighted: true,
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
  },
  premium: {
    name: 'Premium',
    price: '499rb',
    period: '/bulan',
    description: 'Untuk tim dan agensi yang produksi konten massal.',
    cta: 'Hubungi Sales',
    highlighted: false,
    gradient: null,
  },
};

const PACKAGES_ORDER = ['basic', 'pro', 'premium'];

export default function PricingSection() {
  const [featuresByPackage, setFeaturesByPackage] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatures() {
      const { data, error } = await supabase
        .from('package_features')
        .select('*')
        .order('feature_key');

      if (!error && data) {
        const grouped = {};
        PACKAGES_ORDER.forEach(pkg => { grouped[pkg] = []; });
        data.forEach(row => {
          if (grouped[row.package]) {
            grouped[row.package].push(row);
          }
        });
        setFeaturesByPackage(grouped);
      }
      setLoading(false);
    }
    loadFeatures();
  }, []);

  return (
    <section className={styles.pricingSection} id="pricing">
      <motion.div
        className={styles.sectionHeader}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
      >
        <span className={styles.sectionBadge}>Harga</span>
        <h2 className={styles.sectionTitle}>
          Pilih Paket yang{' '}
          <span className={styles.gradientText}>Cocok untuk Anda</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          Mulai gratis. Upgrade kapan saja sesuai kebutuhan.
        </p>
      </motion.div>

      <div className={styles.pricingGrid}>
        {PACKAGES_ORDER.map((pkgKey, i) => {
          const plan = PLAN_META[pkgKey];
          const features = featuresByPackage[pkgKey] || [];

          return (
            <motion.div
              key={pkgKey}
              className={`${styles.pricingCard} ${plan.highlighted ? styles.pricingHighlighted : ''}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
            >
              {plan.badge && (
                <div className={styles.pricingBadge}>
                  <Sparkles size={12} />
                  {plan.badge}
                </div>
              )}

              <div className={styles.pricingHeader}>
                <h3 className={styles.pricingName}>{plan.name}</h3>
                <div className={styles.pricingPrice}>
                  <span className={styles.pricingCurrency}>Rp</span>
                  <span className={styles.pricingAmount}>{plan.price}</span>
                  <span className={styles.pricingPeriod}>{plan.period}</span>
                </div>
                <p className={styles.pricingDesc}>{plan.description}</p>
              </div>

              <ul className={styles.pricingFeatures}>
                {loading ? (
                  <li className={styles.pricingFeature} style={{ color: 'var(--text-muted)' }}>
                    Memuat fitur...
                  </li>
                ) : (
                  features.map((feat) => (
                    <li
                      key={feat.id}
                      className={styles.pricingFeature}
                      style={!feat.enabled ? { opacity: 0.4 } : undefined}
                    >
                      {feat.enabled ? (
                        <Check size={16} className={styles.pricingCheck} />
                      ) : (
                        <Lock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      )}
                      <span style={!feat.enabled ? { textDecoration: 'line-through' } : undefined}>
                        {feat.feature_label || feat.feature_key}
                      </span>
                    </li>
                  ))
                )}
              </ul>

              <button
                className={`${styles.pricingCta} ${plan.highlighted ? styles.pricingCtaHighlighted : ''}`}
                style={plan.gradient ? { background: plan.gradient } : undefined}
              >
                {plan.cta}
              </button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
