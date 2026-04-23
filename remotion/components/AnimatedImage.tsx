import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Img } from 'remotion';

interface AnimatedImageProps {
  src: string; // Data URI or URL
  width: number;
  height: number;
  /** Ken Burns zoom direction: 'in' zooms from 1→1.15, 'out' from 1.15→1 */
  kenBurns?: 'in' | 'out' | 'none';
  /** Ken Burns drift direction */
  kenBurnsDrift?: 'left' | 'right' | 'up' | 'down' | 'none';
  /** Spring-based fade+scale entrance */
  animateEntrance?: boolean;
  /** Delay (in frames) before entrance animation starts */
  entranceDelay?: number;
  /** Dark vignette overlay opacity (0-1) */
  vignetteOpacity?: number;
  /** Bottom-heavy gradient overlay for text readability */
  overlayGradient?: string;
  /** Border radius */
  borderRadius?: number;
  /** Object-fit behavior */
  objectFit?: 'cover' | 'contain' | 'fill';
  style?: React.CSSProperties;
}

/**
 * Reusable animated image component for Remotion video slides.
 * Supports Ken Burns pan/zoom, spring-based entrance, vignette overlays.
 */
export const AnimatedImage: React.FC<AnimatedImageProps> = ({
  src,
  width,
  height,
  kenBurns = 'in',
  kenBurnsDrift = 'left',
  animateEntrance = true,
  entranceDelay = 0,
  vignetteOpacity = 0,
  overlayGradient,
  borderRadius = 0,
  objectFit = 'cover',
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // ── Ken Burns Effect ──
  let kbScale = 1;
  let kbX = 0;
  let kbY = 0;
  const totalFrames = Math.min(durationInFrames, 600); // Cap at 20s

  if (kenBurns === 'in') {
    kbScale = interpolate(frame, [0, totalFrames], [1.0, 1.18], { extrapolateRight: 'clamp' });
  } else if (kenBurns === 'out') {
    kbScale = interpolate(frame, [0, totalFrames], [1.18, 1.0], { extrapolateRight: 'clamp' });
  }

  if (kenBurnsDrift === 'left') {
    kbX = interpolate(frame, [0, totalFrames], [0, -30], { extrapolateRight: 'clamp' });
  } else if (kenBurnsDrift === 'right') {
    kbX = interpolate(frame, [0, totalFrames], [0, 30], { extrapolateRight: 'clamp' });
  } else if (kenBurnsDrift === 'up') {
    kbY = interpolate(frame, [0, totalFrames], [0, -20], { extrapolateRight: 'clamp' });
  } else if (kenBurnsDrift === 'down') {
    kbY = interpolate(frame, [0, totalFrames], [0, 20], { extrapolateRight: 'clamp' });
  }

  // ── Entrance Animation ──
  let entranceOpacity = 1;
  let entranceScale = 1;

  if (animateEntrance) {
    const entSpring = spring({
      frame: frame - entranceDelay,
      fps,
      config: { damping: 18, stiffness: 60 },
    });
    entranceOpacity = interpolate(entSpring, [0, 1], [0, 1]);
    entranceScale = interpolate(entSpring, [0, 1], [1.05, 1]);
  }

  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        borderRadius,
        opacity: entranceOpacity,
        ...style,
      }}
    >
      {/* Image with Ken Burns */}
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          transform: `scale(${kbScale * entranceScale}) translate(${kbX}px, ${kbY}px)`,
          transformOrigin: 'center center',
        }}
      />

      {/* Vignette overlay */}
      {vignetteOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${vignetteOpacity}) 100%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Custom gradient overlay (e.g., bottom-heavy for text readability) */}
      {overlayGradient && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: overlayGradient,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};
