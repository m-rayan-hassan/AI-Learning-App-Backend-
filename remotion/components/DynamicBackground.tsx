import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';

// Generates abstract flowing gradient orbs for a premium Keynote/Stripe feel
export const DynamicBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow drift animations for the blobs (1200 frames = 40s full cycle)
  const driftBase = frame / 10;
  
  // Blob 1: Top Left -> Top Right -> Center
  const b1X = interpolate(Math.sin(driftBase * 0.05), [-1, 1], [-200, SLIDE_WIDTH * 0.6]);
  const b1Y = interpolate(Math.cos(driftBase * 0.03), [-1, 1], [-200, SLIDE_HEIGHT * 0.4]);
  
  // Blob 2: Bottom Right -> Bottom Center
  const b2X = interpolate(Math.cos(driftBase * 0.04), [-1, 1], [SLIDE_WIDTH * 0.4, SLIDE_WIDTH + 200]);
  const b2Y = interpolate(Math.sin(driftBase * 0.06), [-1, 1], [SLIDE_HEIGHT * 0.4, SLIDE_HEIGHT + 200]);
  
  // Blob 3: Center drifting slowly mapping
  const b3X = interpolate(Math.sin(driftBase * 0.07), [-1, 1], [SLIDE_WIDTH * 0.2, SLIDE_WIDTH * 0.8]);
  const b3Y = interpolate(Math.cos(driftBase * 0.05), [-1, 1], [SLIDE_HEIGHT * 0.2, SLIDE_HEIGHT * 0.8]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: theme.colors.bg,
        overflow: 'hidden',
        zIndex: 0, // Behind all slide content
      }}
    >
      {/* Base Grid Pattern */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${theme.colors.textMuted}20 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: 0.3,
        }}
      />

      {/* Primary Color Blob */}
      <div
        style={{
          position: 'absolute',
          width: 1200,
          height: 1200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.colors.primary}30 0%, transparent 60%)`,
          left: b1X,
          top: b1Y,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Secondary Color Blob */}
      <div
        style={{
          position: 'absolute',
          width: 1400,
          height: 1400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.colors.secondaryLight}40 0%, transparent 60%)`,
          left: b2X,
          top: b2Y,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Accent Color Blob */}
      <div
        style={{
          position: 'absolute',
          width: 1000,
          height: 1000,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.colors.accentLight}25 0%, transparent 70%)`,
          left: b3X,
          top: b3Y,
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* Noise / Texture Overlay to prevent gradient banding */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundSize: '200px 200px',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
};
