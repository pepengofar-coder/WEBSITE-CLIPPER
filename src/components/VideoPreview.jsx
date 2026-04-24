import { useRef, useEffect } from 'react';

/**
 * Shared 9:16 video preview component.
 * - If the URL is a YouTube link → renders a YouTube iframe embed.
 * - Otherwise → falls back to a looping demo video.
 */
export function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export default function VideoPreview({ url, isPlaying, startTime = 0, style = {} }) {
  const videoRef = useRef(null);
  const ytId = extractYouTubeId(url);

  // Control native <video> play/pause
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
    ...style,
  };

  if (ytId) {
    // Build YouTube embed URL with appropriate params
    const src =
      `https://www.youtube.com/embed/${ytId}` +
      `?autoplay=${isPlaying ? 1 : 0}` +
      `&mute=1` +
      `&loop=1` +
      `&playlist=${ytId}` +
      `&controls=0` +
      `&modestbranding=1` +
      `&rel=0` +
      `&start=${Math.floor(startTime)}`;

    return (
      <div style={containerStyle}>
        {/* Oversized iframe: we center it horizontally to simulate 9:16 crop */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '56.25%',   /* 100% * (9/16) */
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <iframe
            src={src}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="YouTube video preview"
          />
        </div>
      </div>
    );
  }

  // Fallback: native video (demo clip)
  return (
    <div style={containerStyle}>
      <video
        ref={videoRef}
        src="https://www.w3schools.com/html/mov_bbb.mp4"
        loop
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
}
