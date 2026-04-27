import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import styles from './LandingSections.module.css';

export default function FinalCtaSection() {
  return (
    <section className={styles.finalCtaSection} id="final-cta">
      <div className={styles.finalCtaGlow} />

      <motion.div
        className={styles.finalCtaContent}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7 }}
      >
        <motion.h2
          className={styles.finalCtaTitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          Siap Clip Video{' '}
          <span className={styles.heroGradientText}>Lebih Cerdas</span>?
        </motion.h2>

        <motion.p
          className={styles.finalCtaSubtitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          Bergabung dengan ribuan kreator yang sudah menghemat waktu editing mereka dengan Zenira. 
          Mulai gratis hari ini.
        </motion.p>

        <motion.div
          className={styles.finalCtaButtons}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.6 }}
        >
          <a href="#hero-input" className={styles.finalCtaBtn}>
            <Sparkles size={20} />
            Mulai Clip Sekarang
            <ArrowRight size={18} />
          </a>
        </motion.div>

        <motion.p
          className={styles.finalCtaNote}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          ✓ Tanpa kartu kredit &nbsp;·&nbsp; ✓ Setup instan &nbsp;·&nbsp; ✓ Batal kapan saja
        </motion.p>
      </motion.div>
    </section>
  );
}
