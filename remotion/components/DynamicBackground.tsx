import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';

interface DynamicBackgroundProps {
  themeColors: ThemeColors;
}

/**
 * Animated background with floating gradient orbs.
 * Now fully theme-aware — orb colors adapt to the chosen palette.
 * Dark themes get a darker base; light themes get a lighter base.
 */
export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ themeColors }) => {
  const frame = useCurrentFrame();

  const driftBase = frame / 10;

  const b1X = interpolate(Math.sin(driftBase * 0.05), [-1, 1], [-200, SLIDE_WIDTH * 0.6]);
  const b1Y = interpolate(Math.cos(driftBase * 0.03), [-1, 1], [-200, SLIDE_HEIGHT * 0.4]);

  const b2X = interpolate(Math.cos(driftBase * 0.04), [-1, 1], [SLIDE_WIDTH * 0.4, SLIDE_WIDTH + 200]);
  const b2Y = interpolate(Math.sin(driftBase * 0.06), [-1, 1], [SLIDE_HEIGHT * 0.4, SLIDE_HEIGHT + 200]);

  const b3X = interpolate(Math.sin(driftBase * 0.07), [-1, 1], [SLIDE_WIDTH * 0.2, SLIDE_WIDTH * 0.8]);
  const b3Y = interpolate(Math.cos(driftBase * 0.05), [-1, 1], [SLIDE_HEIGHT * 0.2, SLIDE_HEIGHT * 0.8]);

  const gridColor = themeColors.isDark ? 'rgba(255,255,255,0.04)' : `${themeColors.textMuted}20`;
  const blobOpacity1 = themeColors.isDark ? '25' : '30';
  const blobOpacity2 = themeColors.isDark ? '30' : '40';
  const blobOpacity3 = themeColors.isDark ? '20' : '25';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: themeColors.bg,
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* Subtle grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(${gridColor} 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          opacity: 0.3,
        }}
      />

      {/* Primary blob */}
      <div
        style={{
          position: 'absolute',
          width: 1200,
          height: 1200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${themeColors.primary}${blobOpacity1} 0%, transparent 60%)`,
          left: b1X,
          top: b1Y,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Secondary blob */}
      <div
        style={{
          position: 'absolute',
          width: 1400,
          height: 1400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${themeColors.secondaryLight}${blobOpacity2} 0%, transparent 60%)`,
          left: b2X,
          top: b2Y,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Accent blob */}
      <div
        style={{
          position: 'absolute',
          width: 1000,
          height: 1000,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${themeColors.accentLight}${blobOpacity3} 0%, transparent 70%)`,
          left: b3X,
          top: b3Y,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Noise texture overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: themeColors.isDark ? 0.06 : 0.04,
          backgroundSize: '200px 200px',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
};
