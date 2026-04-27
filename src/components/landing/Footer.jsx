import { Mail, Shield, FileText, ExternalLink } from 'lucide-react';
import styles from './LandingSections.module.css';

export default function Footer() {
  return (
    <footer className={styles.footerSection}>
      <div className={styles.footerInner}>
        {/* Brand */}
        <div className={styles.footerBrand}>
          <div className={styles.footerLogo}>
            <span className={styles.footerLogoIcon}>🎬</span>
            <span className={styles.footerLogoText}>
              Clip<span className={styles.footerLogoAccent}>Forge</span>
            </span>
          </div>
          <p className={styles.footerBrandDesc}>
            Generator klip viral bertenaga AI. Ubah video panjang jadi konten pendek siap upload dalam hitungan menit.
          </p>
          <div className={styles.footerSocials}>
            <a href="#" className={styles.footerSocial} aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
              </svg>
            </a>
            <a href="#" className={styles.footerSocial} aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="5"/>
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"/>
              </svg>
            </a>
            <a href="#" className={styles.footerSocial} aria-label="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
              </svg>
            </a>
            <a href="#" className={styles.footerSocial} aria-label="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Links */}
        <div className={styles.footerLinks}>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Produk</h4>
            <a href="#demo" className={styles.footerLink}>Cara Kerja</a>
            <a href="#benefits" className={styles.footerLink}>Keunggulan</a>
            <a href="#pricing" className={styles.footerLink}>Harga</a>
            <a href="#testimonials" className={styles.footerLink}>Testimoni</a>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Support</h4>
            <a href="mailto:support@youklip.id" className={styles.footerLink}>
              <Mail size={14} /> support@youklip.id
            </a>
            <a href="#" className={styles.footerLink}>
              <ExternalLink size={14} /> Help Center
            </a>
            <a href="#" className={styles.footerLink}>
              <ExternalLink size={14} /> API Docs
            </a>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerColTitle}>Legal</h4>
            <a href="#privacy" className={styles.footerLink}>
              <Shield size={14} /> Privacy Policy
            </a>
            <a href="#terms" className={styles.footerLink}>
              <FileText size={14} /> Terms of Service
            </a>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <span>© 2026 YouKlip. All rights reserved.</span>
        <span>Made with ❤️ in Indonesia</span>
      </div>
    </footer>
  );
}
