import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { hasResults } = useAppState();
  const dispatch = useAppDispatch();
  const { user, profile, isAdmin, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNewClip = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isHome = location.pathname === '/';

  const navItems = [
    { label: 'Cara Kerja', href: '#demo' },
    { label: 'Keunggulan', href: '#benefits' },
    { label: 'Harga', href: '#pricing' },
    { label: 'Testimoni', href: '#testimonials' },
  ];

  const handleNavClick = (href) => {
    setMobileOpen(false);
    if (!isHome) {
      navigate('/');
      setTimeout(() => {
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoIcon}>✦</span>
        <span>Zen<span className={styles.logoAccent}>ira</span></span>
      </Link>

      <div className={`${styles.navLinks} ${mobileOpen ? styles.navLinksOpen : ''}`}>
        {isHome && navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={styles.navLink}
            onClick={() => handleNavClick(item.href)}
          >
            {item.label}
          </a>
        ))}
        {hasResults && !isHome && (
          <button className={styles.newClipBtn} onClick={handleNewClip}>
            ← Klip Baru
          </button>
        )}

        {/* Auth section */}
        {user ? (
          <>
            {isAdmin && (
              <Link to="/admin" className={styles.navLink} id="admin-link">
                ⚡ Admin
              </Link>
            )}
            <div className={styles.authGroup}>
              <span className={styles.userBadge}>
                {profile?.package === 'premium' ? '💎' : profile?.package === 'pro' ? '⚡' : '👤'}{' '}
                {profile?.package?.charAt(0).toUpperCase() + profile?.package?.slice(1) || 'Basic'}
              </span>
              <button className={styles.signOutBtn} onClick={handleSignOut} id="signout-btn">
                Keluar
              </button>
            </div>
          </>
        ) : (
          <>
            {isHome && (
              <Link to="/login" className={styles.navCta} id="login-nav-btn">
                Masuk
              </Link>
            )}
            {!isHome && (
              <Link to="/login" className={styles.navLink} id="login-nav-link">
                Masuk
              </Link>
            )}
          </>
        )}
      </div>

      {isHome && (
        <button
          className={`${styles.mobileToggle} ${mobileOpen ? styles.mobileToggleOpen : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      )}
    </nav>
  );
}
