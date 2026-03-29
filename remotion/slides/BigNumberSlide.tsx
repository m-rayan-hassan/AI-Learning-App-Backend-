import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface BigNumberSlideProps {
  title: string;
  number: string;
  unit?: string;
  description?: string;
  themeColors: ThemeColors;
}

export const BigNumberSlide: React.FC<BigNumberSlideProps> = ({ title, number, unit, description, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  const numSpring = spring({ frame: frame - 10, fps, config: { damping: 10, stiffness: 50, mass: 1.2 } });
  const numScale = interpolate(numSpring, [0, 1], [0.5, 1]);
  const numOpacity = interpolate(numSpring, [0, 1], [0, 1]);

  const descSpring = spring({ frame: frame - 25, fps, config: { damping: 14, stiffness: 80 } });
  const descOpacity = interpolate(descSpring, [0, 1], [0, 1]);
  const descY = interpolate(descSpring, [0, 1], [20, 0]);

  const ringProgress = interpolate(frame, [15, 60], [0, Math.PI * 2 * 0.75], { extrapolateRight: 'clamp' });
  const ringRadius = 220;

  // Auto-scale number font based on character count
  const numLen = number.length;
  const numFontSize = numLen > 10 ? 80 : numLen > 7 ? 100 : numLen > 4 ? 130 : 160;

  const circleBg = themeColors.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)';
  const circleBorder = themeColors.isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.7)';
  const descBg = themeColors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)';

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.fonts.heading,
      }}
    >
      <DynamicBackground themeColors={themeColors} />

      {/* Animated ring */}
      <svg
        width={560}
        height={560}
        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -55%)', zIndex: 1 }}
      >
        <circle
          cx={280} cy={280} r={ringRadius}
          fill="none"
          stroke={themeColors.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}
          strokeWidth="28"
        />
        <circle
          cx={280} cy={280} r={ringRadius}
          fill="none"
          stroke={themeColors.primary}
          strokeWidth="28"
          strokeLinecap="round"
          strokeDasharray={Math.PI * 2 * ringRadius}
          strokeDashoffset={Math.PI * 2 * ringRadius - ringProgress * ringRadius}
          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
        />
      </svg>

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          background: circleBg,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '50%',
          width: 400,
          height: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme.shadow.elevated,
          border: circleBorder,
          opacity: numOpacity,
          transform: `scale(${numScale})`,
        }}
      >
        <h3
          style={{
            fontSize: theme.fontSize.h3,
            fontWeight: 500,
            color: themeColors.textSecondary,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            margin: 0,
            marginBottom: theme.spacing.sm,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          {title}
        </h3>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
          <span
            style={{
              fontSize: numFontSize,
              fontWeight: 900,
              color: themeColors.textPrimary,
              lineHeight: 1,
              letterSpacing: -5,
            }}
          >
            {number}
          </span>
          {unit && (
            <span
              style={{
                fontSize: theme.fontSize.h1,
                fontWeight: 600,
                color: themeColors.primary,
                marginLeft: theme.spacing.xs,
              }}
            >
              {unit}
            </span>
          )}
        </div>
      </div>

      {description && (
        <p
          style={{
            position: 'relative',
            zIndex: 10,
            fontSize: theme.fontSize.h3,
            color: themeColors.textSecondary,
            opacity: descOpacity,
            transform: `translateY(${descY}px)`,
            margin: 0,
            marginTop: theme.spacing.xl,
            maxWidth: 700,
            lineHeight: 1.5,
            textAlign: 'center',
            background: descBg,
            backdropFilter: 'blur(8px)',
            padding: theme.spacing.md,
            borderRadius: theme.borderRadius.lg,
            border: circleBorder,
            fontFamily: theme.fonts.body,
          }}
        >
          {description}
        </p>
      )}
    </div>
  );
};
