import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';
import { AnimatedImage } from '../components/AnimatedImage';

interface TitleSlideProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  themeColors: ThemeColors;
}

export const TitleSlide: React.FC<TitleSlideProps> = ({ title, subtitle, imageUrl, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });
  const cardScale = interpolate(cardSpring, [0, 1], [0.8, 1]);
  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);

  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 80 } });
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  const subtitleSpring = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 80 } });
  const subtitleY = interpolate(subtitleSpring, [0, 1], [30, 0]);
  const subtitleOpacity = interpolate(subtitleSpring, [0, 1], [0, 1]);

  const floatY = Math.sin(frame / 30) * 8;

  // Auto-scale title font
  const titleLen = title.length;
  const titleFontSize = titleLen > 60 ? theme.fontSize.h1 : titleLen > 35 ? theme.fontSize.hero : theme.fontSize.hero * 1.1;

  const hasImage = !!imageUrl;

  const cardBg = hasImage
    ? 'rgba(0,0,0,0.35)'
    : themeColors.isDark
    ? 'rgba(255,255,255,0.06)'
    : 'rgba(255,255,255,0.65)';
  const cardBorder = hasImage
    ? '1px solid rgba(255,255,255,0.15)'
    : themeColors.isDark
    ? '1px solid rgba(255,255,255,0.12)'
    : '1px solid rgba(255,255,255,0.8)';

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
      {/* Background: AI image or gradient */}
      {hasImage ? (
        <AnimatedImage
          src={imageUrl!}
          width={SLIDE_WIDTH}
          height={SLIDE_HEIGHT}
          kenBurns="out"
          kenBurnsDrift="right"
          animateEntrance={false}
          vignetteOpacity={0.45}
          overlayGradient="linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.45) 70%, rgba(0,0,0,0.65) 100%)"
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        />
      ) : (
        <DynamicBackground themeColors={themeColors} />
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          background: cardBg,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: cardBorder,
          borderRadius: theme.borderRadius.xl,
          padding: `${theme.spacing.xxl}px ${theme.spacing.xl}px`,
          width: '85%',
          maxWidth: 1000,
          textAlign: 'center',
          boxShadow: hasImage ? '0 16px 50px rgba(0,0,0,0.3)' : theme.shadow.elevated,
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
            background: hasImage
              ? 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.3))'
              : themeColors.gradientPrimary,
            borderRadius: theme.borderRadius.pill,
            marginBottom: theme.spacing.lg,
          }}
        />

        <h1
          style={{
            fontSize: titleFontSize,
            fontWeight: 800,
            color: hasImage ? '#ffffff' : themeColors.textPrimary,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            lineHeight: 1.1,
            letterSpacing: -2,
            margin: 0,
            marginBottom: subtitle ? theme.spacing.md : 0,
            textShadow: hasImage ? '0 2px 20px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              fontSize: theme.fontSize.h3,
              fontWeight: 500,
              color: hasImage ? 'rgba(255,255,255,0.85)' : themeColors.textSecondary,
              opacity: subtitleOpacity,
              transform: `translateY(${subtitleY}px)`,
              margin: 0,
              maxWidth: 800,
              lineHeight: 1.5,
              fontFamily: theme.fonts.body,
              textShadow: hasImage ? '0 1px 10px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
