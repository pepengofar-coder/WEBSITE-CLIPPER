import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        setSuccess('Akun berhasil dibuat! Cek email untuk verifikasi.');
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.bgGlow} />
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logoIcon}>✦</span>
          <h1 className={styles.title}>
            {isSignUp ? 'Buat Akun' : 'Masuk ke'}{' '}
            <span className={styles.brand}>Zenira</span>
          </h1>
          <p className={styles.subtitle}>
            {isSignUp
              ? 'Daftar gratis untuk mulai clipping.'
              : 'Masuk untuk akses fitur lengkap.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              id="login-email"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
              id="login-password"
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
            id="login-submit"
          >
            {loading
              ? '⏳ Memproses...'
              : isSignUp
                ? 'Daftar'
                : 'Masuk'}
          </button>
        </form>

        <div className={styles.toggle}>
          <span className={styles.toggleText}>
            {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}
          </span>
          <button
            className={styles.toggleBtn}
            onClick={() => { setIsSignUp(!isSignUp); setError(null); setSuccess(null); }}
          >
            {isSignUp ? 'Masuk' : 'Daftar Gratis'}
          </button>
        </div>
      </div>
    </div>
  );
}
