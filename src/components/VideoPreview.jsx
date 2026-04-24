import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Extract YouTube video ID from various URL formats.
 */
export function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

// Load YouTube IFrame API once globally
let ytApiReady = false;
let ytApiCallbacks = [];

function ensureYTApi() {
  if (ytApiReady) return Promise.resolve();
  if (window.YT && window.YT.Player) {
    ytApiReady = true;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    ytApiCallbacks.push(resolve);

    if (!document.getElementById('yt-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);

      window.onYouTubeIframeAPIReady = () => {
        ytApiReady = true;
        ytApiCallbacks.forEach(cb => cb());
        ytApiCallbacks = [];
      };
    }
  });
}

/**
 * VideoPreview — 9:16 video preview component with sound.
 * Uses YouTube IFrame Player API for full control.
 */
export default function VideoPreview({ url, isPlaying, startTime = 0, style = {} }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const ytId = extractYouTubeId(url);
  const [playerReady, setPlayerReady] = useState(false);

  // Initialize YouTube player
  useEffect(() => {
    if (!ytId || !containerRef.current) return;

    let player = null;
    let destroyed = false;

    const initPlayer = async () => {
      await ensureYTApi();
      if (destroyed) return;

      // Create a div for the player inside the container
      const playerDiv = document.createElement('div');
      playerDiv.id = `yt-player-${Math.random().toString(36).slice(2, 9)}`;
      const wrapper = containerRef.current?.querySelector('.yt-player-wrapper');
      if (!wrapper) return;
      wrapper.innerHTML = '';
      wrapper.appendChild(playerDiv);

      player = new window.YT.Player(playerDiv.id, {
        videoId: ytId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          iv_load_policy: 3,
          start: Math.floor(startTime),
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (!destroyed) {
              playerRef.current = player;
              setPlayerReady(true);
            }
          },
        },
      });
    };

    initPlayer();

    return () => {
      destroyed = true;
      setPlayerReady(false);
      if (player && typeof player.destroy === 'function') {
        try { player.destroy(); } catch {}
      }
      playerRef.current = null;
    };
  }, [ytId]); // Only re-init when video ID changes

  // Handle play/pause
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    const p = playerRef.current;

    try {
      if (isPlaying) {
        p.unMute();
        p.setVolume(80);
        p.seekTo(startTime, true);
        p.playVideo();
      } else {
        p.pauseVideo();
      }
    } catch {}
  }, [isPlaying, playerReady, startTime]);

  // Control native <video> play/pause (fallback)
  useEffect(() => {
    if (ytId || !videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, ytId]);

  const containerStyle = {
    position: 'relative',
    width: '100%',
    aspectRatio: '9 / 16',
    background: '#000',
    overflow: 'hidden',
    borderRadius: '12px',
    ...style,
  };

  if (ytId) {
    return (
      <div ref={containerRef} style={containerStyle}>
        {/* Scaled 16:9 player to fill 9:16 space */}
        <div
          className="yt-player-wrapper"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '316%',
            aspectRatio: '16 / 9',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />

        {/* Loading state */}
        {!playerReady && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '0.85rem',
          }}>
            Memuat video...
          </div>
        )}
      </div>
    );
  }

  // Fallback: native video
  return (
    <div style={containerStyle}>
      <video
        ref={videoRef}
        src="https://www.w3schools.com/html/mov_bbb.mp4"
        loop
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
