import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './AdminPage.module.css';

const PACKAGES = ['basic', 'pro', 'premium'];

export default function AdminPage() {
  const { isAdmin, loading, user, allPackageFeatures, updateUserPackage, updateFeatureEnabled, fetchAllUsers, fetchAllRenderJobs, refreshFeatures } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [toastMsg, setToastMsg] = useState(null);

  // Redirect non-admin
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [loading, user, isAdmin, navigate]);

  // Load users and jobs
  useEffect(() => {
    if (isAdmin) {
      fetchAllUsers()
        .then(setUsers)
        .catch(console.error)
        .finally(() => setUsersLoading(false));

      fetchAllRenderJobs()
        .then(setJobs)
        .catch(console.error)
        .finally(() => setJobsLoading(false));
    }
  }, [isAdmin, fetchAllUsers, fetchAllRenderJobs]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleChangePackage = async (userId, newPkg) => {
    try {
      await updateUserPackage(userId, newPkg);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, package: newPkg } : u));
      showToast(`✅ Paket berhasil diubah ke ${newPkg}`);
    } catch (err) {
      showToast(`❌ Gagal: ${err.message}`);
    }
  };

  const handleToggleFeature = async (featureId, currentEnabled) => {
    try {
      await updateFeatureEnabled(featureId, !currentEnabled);
      showToast(`✅ Fitur berhasil di${!currentEnabled ? 'aktifkan' : 'nonaktifkan'}`);
    } catch (err) {
      showToast(`❌ Gagal: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className={styles.adminPage}>
        <div className={styles.loadingState}>Memuat...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  // Group features by package
  const featuresByPackage = {};
  PACKAGES.forEach(pkg => {
    featuresByPackage[pkg] = allPackageFeatures.filter(f => f.package === pkg);
  });

  return (
    <div className={styles.adminPage}>
      <div className={styles.bgGlow} />

      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.badge}>Admin Panel</span>
          <h1 className={styles.title}>
            Kelola <span className={styles.gradient}>Pengguna & Fitur</span>
          </h1>
          <p className={styles.subtitle}>Kontrol akses paket dan fitur dari satu dashboard.</p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'users' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Pengguna
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'features' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('features')}
          >
            ⚙️ Fitur per Paket
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'jobs' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            📊 Render Jobs
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className={styles.section}>
            {usersLoading ? (
              <div className={styles.loadingState}>Memuat pengguna...</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Paket</th>
                      <th>Bergabung</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className={styles.emailCell}>
                          {u.email || '—'}
                        </td>
                        <td>
                          <span className={`${styles.roleBadge} ${u.role === 'admin' ? styles.roleAdmin : ''}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.pkgBadge} ${styles[`pkg${u.package?.charAt(0).toUpperCase() + u.package?.slice(1)}`]}`}>
                            {u.package}
                          </span>
                        </td>
                        <td className={styles.dateCell}>
                          {new Date(u.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td>
                          <select
                            className={styles.pkgSelect}
                            value={u.package}
                            onChange={(e) => handleChangePackage(u.id, e.target.value)}
                          >
                            {PACKAGES.map(pkg => (
                              <option key={pkg} value={pkg}>{pkg.charAt(0).toUpperCase() + pkg.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className={styles.section}>
            <div className={styles.featuresGrid}>
              {PACKAGES.map(pkg => (
                <div key={pkg} className={styles.featureColumn}>
                  <h3 className={styles.featureColTitle}>
                    <span className={`${styles.pkgDot} ${styles[`dot${pkg.charAt(0).toUpperCase() + pkg.slice(1)}`]}`} />
                    {pkg.charAt(0).toUpperCase() + pkg.slice(1)}
                  </h3>
                  <div className={styles.featureList}>
                    {featuresByPackage[pkg]?.map(f => (
                      <div key={f.id} className={styles.featureRow}>
                        <div className={styles.featureInfo}>
                          <span className={styles.featureLabel}>{f.feature_label || f.feature_key}</span>
                          <span className={styles.featureKey}>{f.feature_key}</span>
                        </div>
                        <button
                          className={`${styles.featureToggle} ${f.enabled ? styles.toggleOn : styles.toggleOff}`}
                          onClick={() => handleToggleFeature(f.id, f.enabled)}
                          title={f.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          <span className={styles.toggleKnob} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className={styles.section}>
            {jobsLoading ? (
              <div className={styles.loadingState}>Memuat data render jobs...</div>
            ) : jobs.length === 0 ? (
              <div className={styles.loadingState}>Belum ada aktivitas render.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Job ID</th>
                      <th>User</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Quality</th>
                      <th>Dibuat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map(job => (
                      <tr key={job.id}>
                        <td>{job.id.substring(0, 8)}</td>
                        <td className={styles.emailCell}>
                          {job.profiles?.email || '—'}
                        </td>
                        <td>{job.title}</td>
                        <td>
                          <span className={`${styles.statusBadge} ${styles['status' + job.status.charAt(0).toUpperCase() + job.status.slice(1)]}`}>
                            {job.status}
                          </span>
                        </td>
                        <td>{job.quality}</td>
                        <td className={styles.dateCell}>
                          {new Date(job.created_at).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className={styles.toast}>{toastMsg}</div>
      )}
    </div>
  );
}
