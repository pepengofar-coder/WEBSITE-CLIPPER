import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState, useAppDispatch } from '../context/AppContext';
import { uploadRawVideo } from '../../lib/clipJobService';
import { useAuth } from '../context/AuthContext';
import styles from './LinkInput.module.css';

export default function LinkInput() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { actions } = useAppState();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.type.startsWith('video/')) {
        setError('Please select a valid video file.');
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to upload videos.');
      navigate('/login');
      return;
    }
    
    if (!file) {
      setError('Silakan pilih file video');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const storagePath = await uploadRawVideo(file, user.id);
      
      dispatch({
        type: 'SET_URL',
        payload: { url: storagePath, platform: 'upload' },
      });

      // Instead of checkUrl, we directly start processing with the uploaded path
      const job = await actions.startProcessing(storagePath, 'upload');

      if (job) {
        navigate('/processing');
      } else {
        setError('Gagal memulai proses. Silakan coba lagi.');
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.stepContainer}>
      <div className={styles.stepHeader}>
        <span className={styles.stepBadge}>Langkah 1</span>
        <h2 className={styles.stepTitle}>Pilih Video</h2>
        <p className={styles.stepHelper}>Upload video Anda (Max 500MB)</p>
      </div>
      <form className={styles.linkInputWrapper} onSubmit={handleUpload}>
        <div className={styles.inputContainer}>
          <span className={styles.linkIcon}>📁</span>
          <input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className={styles.input}
            style={{ padding: '10px 15px', color: '#fff' }}
          />
          <button
            type="submit"
            className={styles.generateBtn}
            disabled={!file || isUploading}
          >
            <span>{isUploading ? 'Uploading...' : 'Upload & Proses'}</span>
            <span className={styles.btnIcon}>→</span>
          </button>
        </div>

        {error && <p className={styles.errorMsg}>{error}</p>}
      </form>
    </div>
  );
}
