import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';

interface SectionDividerSlideProps {
  sectionNumber: number;
  title: string;
  subtitle?: string;
  themeColors: ThemeColors;
}

export const SectionDividerSlide: React.FC<SectionDividerSlideProps> = ({ sectionNumber, title, subtitle, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Giant number bg
  const numSpring = spring({ frame, fps, config: { damping: 10, stiffness: 50, mass: 1.5 } });
  const numScale = interpolate(numSpring, [0, 1], [0.5, 1]);
  const numOpacity = interpolate(numSpring, [0, 1], [0, 0.08]);

  // Content
  const contentSpring = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 80 } });
  const contentOpacity = interpolate(contentSpring, [0, 1], [0, 1]);
  const contentY = interpolate(contentSpring, [0, 1], [50, 0]);

  // Accent line
  const lineSpring = spring({ frame: frame - 25, fps, config: { damping: 14, stiffness: 70 } });
  const lineWidth = interpolate(lineSpring, [0, 1], [0, 120]);

  // Subtle background drift
  const driftX = interpolate(frame, [0, 300], [0, -15], { extrapolateRight: 'clamp' });

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
        background: themeColors.isDark
          ? `linear-gradient(135deg, ${themeColors.bg} 0%, #1a1a2e 50%, ${themeColors.bg} 100%)`
          : themeColors.gradientBg,
      }}
    >
      {/* Giant background number */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${driftX}px), -50%) scale(${numScale})`,
          fontSize: 600,
          fontWeight: 900,
          color: themeColors.textPrimary,
          opacity: numOpacity,
          lineHeight: 1,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        {String(sectionNumber).padStart(2, '0')}
      </div>

      {/* Accent decorative circles */}
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          border: `2px solid ${themeColors.primary}15`,
          top: -100,
          right: -100,
          zIndex: 1,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 250,
          height: 250,
          borderRadius: '50%',
          border: `2px solid ${themeColors.secondary}15`,
          bottom: -60,
          left: -60,
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          opacity: contentOpacity,
          transform: `translateY(${contentY}px)`,
        }}
      >
        {/* Section label */}
        <span
          style={{
            fontSize: theme.fontSize.small,
            fontWeight: 700,
            color: themeColors.primary,
            textTransform: 'uppercase',
            letterSpacing: 6,
            display: 'block',
            marginBottom: theme.spacing.md,
          }}
        >
          Section {sectionNumber}
        </span>

        {/* Title */}
        <h1
          style={{
            fontSize: title.length > 30 ? theme.fontSize.h1 : theme.fontSize.hero * 1.2,
            fontWeight: 900,
            color: themeColors.textPrimary,
            lineHeight: 1.1,
            letterSpacing: -3,
            margin: 0,
            maxWidth: 900,
          }}
        >
          {title}
        </h1>

        {/* Accent line */}
        <div
          style={{
            width: lineWidth,
            height: 5,
            background: themeColors.gradientPrimary,
            borderRadius: theme.borderRadius.pill,
            margin: `${theme.spacing.lg}px auto 0`,
          }}
        />

        {subtitle && (
          <p
            style={{
              fontSize: theme.fontSize.h3,
              fontWeight: 500,
              color: themeColors.textSecondary,
              margin: 0,
              marginTop: theme.spacing.lg,
              maxWidth: 700,
              lineHeight: 1.5,
              fontFamily: theme.fonts.body,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
