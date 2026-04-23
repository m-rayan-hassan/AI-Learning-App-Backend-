import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { AnimatedImage } from '../components/AnimatedImage';
import { DynamicBackground } from '../components/DynamicBackground';

interface HeroTitleSlideProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  themeColors: ThemeColors;
}

/**
 * Cinema-grade opening title slide with full-bleed AI-generated background image.
 * Used as the first slide of the video for maximum visual impact.
 */
export const HeroTitleSlide: React.FC<HeroTitleSlideProps> = ({
  title,
  subtitle,
  imageUrl,
  themeColors,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card animation — scales and fades in
  const cardSpring = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 50 } });
  const cardScale = interpolate(cardSpring, [0, 1], [0.85, 1]);
  const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);

  // Title text animation
  const titleSpring = spring({ frame: frame - 18, fps, config: { damping: 14, stiffness: 70 } });
  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  // Subtitle animation
  const subSpring = spring({ frame: frame - 28, fps, config: { damping: 14, stiffness: 70 } });
  const subY = interpolate(subSpring, [0, 1], [30, 0]);
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

  // Accent line animation
  const lineSpring = spring({ frame: frame - 12, fps, config: { damping: 18, stiffness: 80 } });
  const lineWidth = interpolate(lineSpring, [0, 1], [0, 80]);

  // Floating motion
  const floatY = Math.sin(frame / 25) * 6;

  // Auto-scale title font
  const titleLen = title.length;
  const titleFontSize = titleLen > 60 ? theme.fontSize.h1 : titleLen > 35 ? theme.fontSize.hero : theme.fontSize.hero * 1.15;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.fonts.heading,
      }}
    >
      {/* Background layer: AI image or fallback gradient */}
      {imageUrl ? (
        <AnimatedImage
          src={imageUrl}
          width={SLIDE_WIDTH}
          height={SLIDE_HEIGHT}
          kenBurns="in"
          kenBurnsDrift="left"
          animateEntrance={false}
          vignetteOpacity={0.5}
          overlayGradient="linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.75) 100%)"
          style={{ position: 'absolute', inset: 0 }}
        />
      ) : (
        <DynamicBackground themeColors={themeColors} />
      )}

      {/* Animated particles / dots */}
      {[...Array(6)].map((_, i) => {
        const speed = 0.02 + (i * 0.008);
        const size = 4 + (i % 3) * 2;
        const x = interpolate(
          Math.sin(frame * speed + i * 2.1),
          [-1, 1],
          [SLIDE_WIDTH * 0.1, SLIDE_WIDTH * 0.9]
        );
        const y = interpolate(
          Math.cos(frame * speed * 0.7 + i * 1.5),
          [-1, 1],
          [SLIDE_HEIGHT * 0.1, SLIDE_HEIGHT * 0.9]
        );
        const opacity = interpolate(
          Math.sin(frame * 0.03 + i),
          [-1, 1],
          [0.15, 0.4]
        );

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: imageUrl ? 'rgba(255,255,255,0.6)' : themeColors.primaryLight,
              opacity,
              zIndex: 5,
              boxShadow: `0 0 ${size * 3}px ${imageUrl ? 'rgba(255,255,255,0.3)' : themeColors.primary + '40'}`,
            }}
          />
        );
      })}

      {/* Glassmorphism title card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: imageUrl
              ? 'rgba(0,0,0,0.35)'
              : themeColors.isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: imageUrl
              ? '1px solid rgba(255,255,255,0.15)'
              : themeColors.isDark
              ? '1px solid rgba(255,255,255,0.12)'
              : '1px solid rgba(255,255,255,0.8)',
            borderRadius: theme.borderRadius.xl + 4,
            padding: `${theme.spacing.xxl}px ${theme.spacing.xl * 1.2}px`,
            width: '82%',
            maxWidth: 1020,
            textAlign: 'center',
            boxShadow: imageUrl
              ? '0 20px 60px rgba(0,0,0,0.3)'
              : theme.shadow.elevated,
            opacity: cardOpacity,
            transform: `scale(${cardScale}) translateY(${floatY}px)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Accent line */}
          <div
            style={{
              width: lineWidth,
              height: 4,
              background: imageUrl
                ? 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))'
                : themeColors.gradientPrimary,
              borderRadius: theme.borderRadius.pill,
              marginBottom: theme.spacing.lg,
            }}
          />

          {/* Title */}
          <h1
            style={{
              fontSize: titleFontSize,
              fontWeight: 800,
              color: imageUrl ? '#ffffff' : themeColors.textPrimary,
              opacity: titleOpacity,
              transform: `translateY(${titleY}px)`,
              lineHeight: 1.08,
              letterSpacing: -2.5,
              margin: 0,
              marginBottom: subtitle ? theme.spacing.md : 0,
              textShadow: imageUrl ? '0 2px 20px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {title}
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p
              style={{
                fontSize: theme.fontSize.h3,
                fontWeight: 500,
                color: imageUrl ? 'rgba(255,255,255,0.85)' : themeColors.textSecondary,
                opacity: subOpacity,
                transform: `translateY(${subY}px)`,
                margin: 0,
                maxWidth: 800,
                lineHeight: 1.5,
                fontFamily: theme.fonts.body,
                textShadow: imageUrl ? '0 1px 10px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
