import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { PROCESSING_STEPS, VIRAL_QUOTES } from '../utils/mockData';
import styles from './ProcessingPage.module.css';

export default function ProcessingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const navigate = useNavigate();
  const { currentJobId, actions } = useAppState();
  const dispatch = useAppDispatch();
  const timerRef = useRef(null);
  const finishedRef = useRef(false);

  // Redirect to home if no job is active
  useEffect(() => {
    if (!currentJobId) {
      navigate('/');
    }
  }, [currentJobId, navigate]);

  // Simulate processing steps
  useEffect(() => {
    if (!currentJobId) return;

    const stepDuration = 1800;
    const totalSteps = PROCESSING_STEPS.length;

    timerRef.current = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next >= totalSteps) {
          clearInterval(timerRef.current);
          // Finish processing — save clips to Supabase
          if (!finishedRef.current) {
            finishedRef.current = true;
            setTimeout(async () => {
              await actions.finishProcessing(currentJobId);
              navigate('/results');
            }, 800);
          }
          return prev;
        }
        return next;
      });
    }, stepDuration);

    return () => clearInterval(timerRef.current);
  }, [currentJobId, actions, navigate]);

  // Progress bar animation
  useEffect(() => {
    const totalSteps = PROCESSING_STEPS.length;
    const targetProgress = ((currentStep + 1) / totalSteps) * 100;
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= targetProgress) {
          clearInterval(interval);
          return targetProgress;
        }
        return prev + 1;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [currentStep]);

  // Rotate quotes
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % VIRAL_QUOTES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Generate waveform bars
  const waveBars = Array.from({ length: 40 }, (_, i) => (
    <div
      key={i}
      className={styles.waveBar}
      style={{
        animationDelay: `${i * 0.05}s`,
        height: `${4 + Math.random() * 30}px`,
      }}
    />
  ));

  return (
    <div className={styles.processingPage}>
      <div className={styles.bgGlow} />

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Title */}
        <h2 className={styles.title}>
          <span className={styles.brainIcon}>🧠</span>
          Analyzing...
        </h2>

        {/* Progress Bar */}
        <div className={styles.progressWrapper}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.stepLabel}>
            Step {Math.min(currentStep + 1, PROCESSING_STEPS.length)} of {PROCESSING_STEPS.length}
          </span>
        </div>

        {/* Steps */}
        <div className={styles.stepsList}>
          {PROCESSING_STEPS.map((step, i) => {
            let status = 'pending';
            if (i < currentStep) status = 'completed';
            else if (i === currentStep) status = 'active';

            return (
              <motion.div
                key={step.id}
                className={`${styles.step} ${styles[status]}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
              >
                {status === 'completed' && <span className={styles.stepIcon}>✅</span>}
                {status === 'active' && <div className={styles.spinner} />}
                {status === 'pending' && <div className={styles.pendingDot} />}
                <span>{step.label}{status === 'active' ? '...' : ''}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Quote */}
        <AnimatePresence mode="wait">
          <motion.div
            key={quoteIndex}
            className={styles.quoteCard}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <p className={styles.quoteText}>
              <span className={styles.quoteIcon}>💡</span>
              "{VIRAL_QUOTES[quoteIndex]}"
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Waveform */}
        <div className={styles.waveform}>
          {waveBars}
        </div>
      </motion.div>
    </div>
  );
}
