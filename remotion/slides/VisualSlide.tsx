import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { AnimatedImage } from '../components/AnimatedImage';
import { DynamicBackground } from '../components/DynamicBackground';

interface VisualSlideProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  themeColors: ThemeColors;
}

/**
 * Full-bleed cinematic image slide with text overlay.
 * The AI-generated image fills the entire canvas with a dark gradient
 * overlay ensuring text readability. Feels like a documentary frame.
 */
export const VisualSlide: React.FC<VisualSlideProps> = ({
  title,
  subtitle,
  imageUrl,
  themeColors,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleSpring = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 70 } });
  const titleY = interpolate(titleSpring, [0, 1], [60, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  // Subtitle animation
  const subSpring = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 70 } });
  const subY = interpolate(subSpring, [0, 1], [30, 0]);
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

  // Bottom accent line
  const lineSpring = spring({ frame: frame - 6, fps, config: { damping: 20, stiffness: 80 } });
  const lineWidth = interpolate(lineSpring, [0, 1], [0, 120]);

  // Auto-scale font
  const titleLen = title.length;
  const titleFontSize = titleLen > 60 ? theme.fontSize.h2 : titleLen > 35 ? theme.fontSize.h1 : theme.fontSize.hero;

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
      {/* Full-bleed background image */}
      {imageUrl ? (
        <AnimatedImage
          src={imageUrl}
          width={SLIDE_WIDTH}
          height={SLIDE_HEIGHT}
          kenBurns="out"
          kenBurnsDrift="right"
          animateEntrance={true}
          entranceDelay={0}
          vignetteOpacity={0.45}
          overlayGradient="linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0.82) 100%)"
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        />
      ) : (
        <DynamicBackground themeColors={themeColors} />
      )}

      {/* Text content — anchored at bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: `${theme.spacing.xl}px ${theme.spacing.xl * 1.5}px`,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.sm,
        }}
      >
        {/* Accent line */}
        <div
          style={{
            width: lineWidth,
            height: 4,
            background: imageUrl
              ? 'linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0.3))'
              : themeColors.gradientPrimary,
            borderRadius: theme.borderRadius.pill,
            marginBottom: theme.spacing.xs,
          }}
        />

        {/* Title */}
        <h2
          style={{
            fontSize: titleFontSize,
            fontWeight: 800,
            color: imageUrl ? '#ffffff' : themeColors.textPrimary,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            lineHeight: 1.1,
            letterSpacing: -2,
            margin: 0,
            textShadow: imageUrl ? '0 2px 30px rgba(0,0,0,0.5)' : 'none',
            maxWidth: SLIDE_WIDTH * 0.75,
          }}
        >
          {title}
        </h2>

        {/* Subtitle / caption */}
        {subtitle && (
          <p
            style={{
              fontSize: theme.fontSize.bodyLarge,
              fontWeight: 500,
              color: imageUrl ? 'rgba(255,255,255,0.8)' : themeColors.textSecondary,
              opacity: subOpacity,
              transform: `translateY(${subY}px)`,
              margin: 0,
              maxWidth: SLIDE_WIDTH * 0.65,
              lineHeight: 1.5,
              fontFamily: theme.fonts.body,
              textShadow: imageUrl ? '0 1px 15px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
