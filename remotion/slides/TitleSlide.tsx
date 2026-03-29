import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface TitleSlideProps {
  title: string;
  subtitle?: string;
}

export const TitleSlide: React.FC<TitleSlideProps> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Glass card entrance animation
  const cardSpring = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });
  const cardScale = interpolate(cardSpring, [0, 1], [0.8, 1]);
  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);

  // Title reveals slightly after card
  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 80 } });
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  // Subtitle reveals last
  const subtitleSpring = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 80 } });
  const subtitleY = interpolate(subtitleSpring, [0, 1], [30, 0]);
  const subtitleOpacity = interpolate(subtitleSpring, [0, 1], [0, 1]);

  // Subtle floating motion for the glass card
  const floatY = Math.sin(frame / 30) * 10;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.fonts.heading,
      }}
    >
      <DynamicBackground />

      {/* Glassmorphism Presentation Card */}
      <div 
        style={{
          position: 'relative',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          borderRadius: theme.borderRadius.xl,
          padding: `${theme.spacing.xxl}px ${theme.spacing.xl}px`,
          width: '85%',
          maxWidth: 1000,
          textAlign: 'center',
          boxShadow: theme.shadow.elevated,
          opacity: cardOpacity,
          transform: `scale(${cardScale}) translateY(${floatY}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div 
          style={{
            width: 60,
            height: 4,
            background: theme.colors.gradientPrimary,
            borderRadius: theme.borderRadius.pill,
            marginBottom: theme.spacing.lg,
          }}
        />

        <h1
          style={{
            fontSize: theme.fontSize.hero * 1.1,
            fontWeight: 800,
            color: theme.colors.textPrimary,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            lineHeight: 1.1,
            letterSpacing: -2,
            margin: 0,
            marginBottom: subtitle ? theme.spacing.md : 0,
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              fontSize: theme.fontSize.h3,
              fontWeight: 500,
              color: theme.colors.textSecondary,
              opacity: subtitleOpacity,
              transform: `translateY(${subtitleY}px)`,
              margin: 0,
              maxWidth: 800,
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
