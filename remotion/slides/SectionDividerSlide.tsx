import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';
import { AnimatedImage } from '../components/AnimatedImage';

interface SectionDividerSlideProps {
  sectionNumber: number;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  themeColors: ThemeColors;
}

export const SectionDividerSlide: React.FC<SectionDividerSlideProps> = ({
  sectionNumber,
  title,
  subtitle,
  imageUrl,
  themeColors,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Number animation
  const numSpring = spring({ frame, fps, config: { damping: 12, stiffness: 50 } });
  const numScale = interpolate(numSpring, [0, 1], [0, 1]);
  const numOpacity = interpolate(numSpring, [0, 1], [0, 1]);

  // Title animation
  const titleSpring = spring({ frame: frame - 12, fps, config: { damping: 14, stiffness: 70 } });
  const titleY = interpolate(titleSpring, [0, 1], [40, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  // Subtitle animation
  const subSpring = spring({ frame: frame - 22, fps, config: { damping: 14, stiffness: 70 } });
  const subY = interpolate(subSpring, [0, 1], [25, 0]);
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

  // Accent line animation
  const lineSpring = spring({ frame: frame - 8, fps, config: { damping: 18, stiffness: 80 } });
  const lineWidth = interpolate(lineSpring, [0, 1], [0, 100]);

  const hasImage = !!imageUrl;

  // Number ring colors
  const ringBg = hasImage
    ? 'rgba(255,255,255,0.12)'
    : themeColors.isDark
    ? 'rgba(255,255,255,0.06)'
    : `${themeColors.primary}10`;
  const ringBorder = hasImage
    ? '3px solid rgba(255,255,255,0.25)'
    : `3px solid ${themeColors.primary}30`;
  const numColor = hasImage ? '#ffffff' : themeColors.primary;

  const titleFontSize = title.length > 30 ? theme.fontSize.h1 : theme.fontSize.hero;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: theme.fonts.heading,
      }}
    >
      {/* Background */}
      {hasImage ? (
        <AnimatedImage
          src={imageUrl!}
          width={SLIDE_WIDTH}
          height={SLIDE_HEIGHT}
          kenBurns="in"
          kenBurnsDrift="down"
          animateEntrance={false}
          vignetteOpacity={0.5}
          overlayGradient="linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.55) 100%)"
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        />
      ) : (
        <DynamicBackground themeColors={themeColors} />
      )}

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Section number in ring */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: ringBg,
            backdropFilter: hasImage ? 'blur(8px)' : 'none',
            WebkitBackdropFilter: hasImage ? 'blur(8px)' : 'none',
            border: ringBorder,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.lg,
            transform: `scale(${numScale})`,
            opacity: numOpacity,
            boxShadow: hasImage ? '0 8px 30px rgba(0,0,0,0.2)' : 'none',
          }}
        >
          <span
            style={{
              fontSize: 42,
              fontWeight: 900,
              color: numColor,
              textShadow: hasImage ? '0 2px 10px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            {sectionNumber}
          </span>
        </div>

        {/* Accent line */}
        <div
          style={{
            width: lineWidth,
            height: 3,
            background: hasImage
              ? 'linear-gradient(to right, rgba(255,255,255,0.7), rgba(255,255,255,0.2))'
              : themeColors.gradientPrimary,
            borderRadius: theme.borderRadius.pill,
            marginBottom: theme.spacing.lg,
          }}
        />

        {/* Title */}
        <h2
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
            maxWidth: 900,
            textShadow: hasImage ? '0 2px 20px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          {title}
        </h2>

        {/* Subtitle */}
        {subtitle && (
          <p
            style={{
              fontSize: theme.fontSize.h3,
              fontWeight: 500,
              color: hasImage ? 'rgba(255,255,255,0.8)' : themeColors.textSecondary,
              opacity: subOpacity,
              transform: `translateY(${subY}px)`,
              margin: 0,
              maxWidth: 700,
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
