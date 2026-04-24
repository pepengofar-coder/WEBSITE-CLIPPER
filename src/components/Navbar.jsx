import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch } from '../context/AppContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { hasResults } = useAppState();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNewClip = () => {
    dispatch({ type: 'RESET' });
    navigate('/');
  };

  const isHome = location.pathname === '/';

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoIcon}>🎬</span>
        <span>Clip<span className={styles.logoAccent}>Forge</span></span>
      </Link>

      <div className={styles.navLinks}>
        {isHome && (
          <a href="#features" className={styles.navLink}>How it Works</a>
        )}
        {hasResults && !isHome && (
          <button className={styles.newClipBtn} onClick={handleNewClip}>
            ← New Clip
          </button>
        )}
      </div>
    </nav>
  );
}
