import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import styles from './LandingSections.module.css';

const plans = [
  {
    name: 'Free',
    price: '0',
    period: 'Selamanya',
    description: 'Mulai tanpa biaya, coba semua fitur dasar.',
    features: [
      '3 klip per hari',
      'Durasi video maks 10 menit',
      'Watermark YouKlip',
      'Export 720p',
      'Auto subtitle dasar',
    ],
    cta: 'Mulai Gratis',
    highlighted: false,
    gradient: null,
  },
  {
    name: 'Pro',
    price: '149rb',
    period: '/bulan',
    description: 'Untuk creator serius yang butuh hasil profesional.',
    badge: 'Paling Populer',
    features: [
      'Unlimited klip per hari',
      'Durasi video maks 3 jam',
      'Tanpa watermark',
      'Export Full HD 1080p',
      'Auto subtitle + terjemahan',
      'Priority processing',
      'Custom branding',
    ],
    cta: 'Mulai Sekarang',
    highlighted: true,
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
  },
  {
    name: 'Agency',
    price: '499rb',
    period: '/bulan',
    description: 'Untuk tim dan agensi yang produksi konten massal.',
    features: [
      'Semua fitur Pro',
      'Durasi video unlimited',
      'Export 4K Ultra HD',
      'Batch processing (10 video)',
      'API access',
      'Team collaboration (5 seat)',
      'Dedicated support',
      'White-label export',
    ],
    cta: 'Hubungi Sales',
    highlighted: false,
    gradient: null,
  },
];

export default function PricingSection() {
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
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
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
              {plan.features.map((feature, j) => (
                <li key={j} className={styles.pricingFeature}>
                  <Check size={16} className={styles.pricingCheck} />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`${styles.pricingCta} ${plan.highlighted ? styles.pricingCtaHighlighted : ''}`}
              style={plan.gradient ? { background: plan.gradient } : undefined}
            >
              {plan.cta}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
