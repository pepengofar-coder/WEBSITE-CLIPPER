import { motion } from 'framer-motion';
import { Upload, Cpu, Download, ArrowRight } from 'lucide-react';
import styles from './LandingSections.module.css';

const steps = [
  {
    icon: Upload,
    number: '01',
    title: 'Upload / Tempel Link',
    description: 'Cukup tempel link video YouTube, TikTok, atau platform lainnya.',
    color: '#7c3aed',
  },
  {
    icon: Cpu,
    number: '02',
    title: 'AI Memproses',
    description: 'AI mendeteksi momen viral, memotong & menambah subtitle otomatis.',
    color: '#3b82f6',
  },
  {
    icon: Download,
    number: '03',
    title: 'Download Klip',
    description: 'Klip siap download dalam format 9:16, langsung upload ke sosmed.',
    color: '#10b981',
  },
];

export default function DemoSection() {
  return (
    <section className={styles.demoSection} id="demo">
      <motion.div
        className={styles.sectionHeader}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
      >
        <span className={styles.sectionBadge}>Cara Kerja</span>
        <h2 className={styles.sectionTitle}>
          Dari Video Panjang ke{' '}
          <span className={styles.gradientText}>Klip Viral</span>{' '}
          dalam 3 Langkah
        </h2>
        <p className={styles.sectionSubtitle}>
          Tidak perlu skill editing. AI kami yang mengerjakan segalanya untuk Anda.
        </p>
      </motion.div>

      {/* Steps */}
      <div className={styles.stepsGrid}>
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            className={styles.stepCard}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
          >
            <div className={styles.stepNumber} style={{ '--step-color': step.color }}>
              {step.number}
            </div>
            <div className={styles.stepIconWrapper} style={{ '--step-color': step.color }}>
              <step.icon size={28} strokeWidth={1.5} />
            </div>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDesc}>{step.description}</p>
            {i < steps.length - 1 && (
              <div className={styles.stepConnector}>
                <ArrowRight size={20} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Before / After Demo */}
      <motion.div
        className={styles.demoPreview}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ delay: 0.3, duration: 0.7 }}
      >
        <div className={styles.demoCard}>
          <div className={styles.demoBefore}>
            <div className={styles.demoLabel}>
              <span className={styles.demoLabelDot} style={{ background: '#ef4444' }} />
              Video Asli — 45:22
            </div>
            <div className={styles.demoVideoPlaceholder}>
              <div className={styles.demoVideoBar} />
              <div className={styles.demoTimeline}>
                <div className={styles.demoTimelineTrack}>
                  <div className={styles.demoHighlight} style={{ left: '12%', width: '8%' }} />
                  <div className={styles.demoHighlight} style={{ left: '38%', width: '6%' }} />
                  <div className={styles.demoHighlight} style={{ left: '67%', width: '10%' }} />
                  <div className={styles.demoHighlight} style={{ left: '85%', width: '5%' }} />
                </div>
              </div>
              <p className={styles.demoVideoText}>🎬 Podcast Episode #47 — Full Length</p>
            </div>
          </div>

          <div className={styles.demoArrow}>
            <div className={styles.demoArrowLine} />
            <div className={styles.demoArrowIcon}>
              <Cpu size={20} />
            </div>
            <span className={styles.demoArrowLabel}>AI Processing</span>
            <div className={styles.demoArrowLine} />
          </div>

          <div className={styles.demoAfter}>
            <div className={styles.demoLabel}>
              <span className={styles.demoLabelDot} style={{ background: '#10b981' }} />
              4 Klip Siap Upload
            </div>
            <div className={styles.demoClipsGrid}>
              {[
                { title: 'Momen Lucu', score: 95, duration: '0:42', color: '#ff6b35' },
                { title: 'Quote Viral', score: 88, duration: '0:31', color: '#f59e0b' },
                { title: 'Tips Produktif', score: 82, duration: '0:55', color: '#3b82f6' },
                { title: 'Ending Hook', score: 78, duration: '0:28', color: '#10b981' },
              ].map((clip, i) => (
                <motion.div
                  key={i}
                  className={styles.demoClip}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                >
                  <div className={styles.demoClipThumb}>
                    <span className={styles.demoClipPlay}>▶</span>
                    <span className={styles.demoClipDuration}>{clip.duration}</span>
                  </div>
                  <div className={styles.demoClipInfo}>
                    <span className={styles.demoClipTitle}>{clip.title}</span>
                    <span className={styles.demoClipScore} style={{ color: clip.color }}>
                      🔥 {clip.score}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
