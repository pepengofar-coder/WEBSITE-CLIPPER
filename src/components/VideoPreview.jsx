import { useRef, useEffect } from 'react';

/**
 * Shared 9:16 video preview component.
 * - If the URL is a YouTube link → renders a YouTube iframe embed.
 * - Otherwise → falls back to a looping demo video.
 *
 * IMPORTANT: The iframe wrapper and the iframe itself both have
 * pointerEvents: 'none' to prevent focus-stealing that would
 * break click events on surrounding React components.
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
    // CRITICAL: prevent iframe from stealing pointer events from parent
    isolation: 'isolate',
    ...style,
  };

  if (ytId) {
    // YouTube is 16:9; to fit it inside a 9:16 container we scale it up.
    // Width needs to be (16/9)/(9/16) = (16*16)/(9*9) ≈ 316% of the container width,
    // centered, so the middle portion (9:16) fills the frame.
    const src =
      `https://www.youtube.com/embed/${ytId}` +
      `?autoplay=${isPlaying ? 1 : 0}` +
      `&mute=1` +
      `&loop=1` +
      `&playlist=${ytId}` +
      `&controls=0` +
      `&modestbranding=1` +
      `&rel=0` +
      `&enablejsapi=0` +
      `&start=${Math.floor(startTime)}`;

    return (
      <div style={containerStyle}>
        {/* Scale the 16:9 iframe to fill the 9:16 space */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            // 16:9 → 9:16: width = 316%, height = 178% (or keep aspect-ratio via transform)
            width: '316%',
            aspectRatio: '16 / 9',
            transform: 'translate(-50%, -50%)',
            // Block ALL pointer events so iframe doesn't steal clicks
            pointerEvents: 'none',
          }}
        >
          <iframe
            src={src}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              // Also block on the iframe element itself
              pointerEvents: 'none',
            }}
            allow="autoplay; encrypted-media"
            title="YouTube video preview"
            tabIndex={-1}
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
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          // Native video should also not steal pointer events
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
