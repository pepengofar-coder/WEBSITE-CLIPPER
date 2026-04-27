import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import styles from './LandingSections.module.css';

const testimonials = [
  {
    name: 'Rina Maharani',
    role: 'Content Creator • 850K Followers',
    avatar: null,
    initials: 'RM',
    color: '#ec4899',
    quote: 'YouKlip bikin saya hemat 5 jam editing setiap hari. Tinggal tempel link podcast, langsung dapat 10+ klip viral. Gila sih ini!',
    rating: 5,
  },
  {
    name: 'Ardi Pratama',
    role: 'Video Editor Freelance',
    avatar: null,
    initials: 'AP',
    color: '#3b82f6',
    quote: 'Dulu ngedit 1 video bisa seharian. Sekarang dengan YouKlip, client saya makin banyak karena output-nya bisa 3x lipat. Auto subtitle-nya juga akurat banget.',
    rating: 5,
  },
  {
    name: 'Siska Dewi',
    role: 'Social Media Manager • Agency',
    avatar: null,
    initials: 'SD',
    color: '#10b981',
    quote: 'Kami manage 15 akun klien. YouKlip jadi senjata rahasia tim kami buat scaling konten tanpa tambah headcount. ROI-nya langsung terasa.',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  return (
    <section className={styles.testimonialsSection} id="testimonials">
      <motion.div
        className={styles.sectionHeader}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
      >
        <span className={styles.sectionBadge}>Testimoni</span>
        <h2 className={styles.sectionTitle}>
          Dipercaya oleh{' '}
          <span className={styles.gradientText}>1000+ Creator</span>
        </h2>
        <p className={styles.sectionSubtitle}>
          Dengar langsung dari mereka yang sudah merasakan manfaat YouKlip.
        </p>
      </motion.div>

      <div className={styles.testimonialsGrid}>
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            className={styles.testimonialCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.12, duration: 0.5 }}
          >
            <div className={styles.testimonialQuoteIcon}>
              <Quote size={20} />
            </div>

            <div className={styles.testimonialStars}>
              {[...Array(t.rating)].map((_, j) => (
                <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />
              ))}
            </div>

            <p className={styles.testimonialQuote}>"{t.quote}"</p>

            <div className={styles.testimonialAuthor}>
              <div
                className={styles.testimonialAvatar}
                style={{ background: t.color }}
              >
                {t.initials}
              </div>
              <div>
                <p className={styles.testimonialName}>{t.name}</p>
                <p className={styles.testimonialRole}>{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
