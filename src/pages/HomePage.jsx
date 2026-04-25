import { motion } from 'framer-motion';
import LinkInput from '../components/LinkInput';
import PlatformBadges from '../components/PlatformBadges';
import HeroSection from '../components/landing/HeroSection';
import DemoSection from '../components/landing/DemoSection';
import BenefitsSection from '../components/landing/BenefitsSection';
import PricingSection from '../components/landing/PricingSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import FinalCtaSection from '../components/landing/FinalCtaSection';
import Footer from '../components/landing/Footer';
import styles from './HomePage.module.css';

export default function HomePage() {
  return (
    <div className={styles.homePage}>
      {/* Ambient background glows */}
      <div className={`${styles.bgGlow} ${styles.bgGlow1}`} />
      <div className={`${styles.bgGlow} ${styles.bgGlow2}`} />
      <div className={`${styles.bgGlow} ${styles.bgGlow3}`} />

      <div className={styles.content}>
        {/* Hero */}
        <HeroSection />

        {/* Input Section */}
        <motion.div
          id="hero-input"
          className={styles.inputSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <LinkInput />
          <PlatformBadges />
        </motion.div>

        {/* Demo / Cara Kerja */}
        <DemoSection />

        {/* Benefits */}
        <BenefitsSection />

        {/* Pricing */}
        <PricingSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Final CTA */}
        <FinalCtaSection />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
