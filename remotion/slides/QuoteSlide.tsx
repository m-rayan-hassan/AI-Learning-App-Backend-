import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';
import { AnimatedImage } from '../components/AnimatedImage';

interface QuoteSlideProps {
  quote: string;
  author?: string;
  imagePrompt?: string;
  imageUrl?: string;
  themeColors: ThemeColors;
}

export const QuoteSlide: React.FC<QuoteSlideProps> = ({ quote, author, imagePrompt, imageUrl, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Quote mark animation
  const quoteMarkSpring = spring({ frame, fps, config: { damping: 14, stiffness: 60 } });
  const quoteMarkScale = interpolate(quoteMarkSpring, [0, 1], [0, 1]);
  const quoteMarkOpacity = interpolate(quoteMarkSpring, [0, 1], [0, 0.3]);

  // Quote text animation
  const textSpring = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 70 } });
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);
  const textY = interpolate(textSpring, [0, 1], [40, 0]);

  // Author animation
  const authorSpring = spring({ frame: frame - 25, fps, config: { damping: 14, stiffness: 80 } });
  const authorOpacity = interpolate(authorSpring, [0, 1], [0, 1]);
  const authorY = interpolate(authorSpring, [0, 1], [20, 0]);

  // Floating motion
  const floatY = Math.sin(frame / 30) * 5;

  const hasImage = !!imageUrl;

  // Text colors based on whether we have a background image
  const textColor = hasImage ? '#ffffff' : themeColors.textPrimary;
  const authorColor = hasImage ? 'rgba(255,255,255,0.75)' : themeColors.textSecondary;
  const quoteMarkColor = hasImage ? 'rgba(255,255,255,0.15)' : `${themeColors.primary}20`;
  const lineColor = hasImage
    ? 'linear-gradient(to right, rgba(255,255,255,0.7), rgba(255,255,255,0.2))'
    : themeColors.gradientPrimary;
  const cardBg = hasImage
    ? 'rgba(0,0,0,0.3)'
    : themeColors.isDark
    ? 'rgba(255,255,255,0.04)'
    : 'rgba(255,255,255,0.5)';
  const cardBorder = hasImage
    ? '1px solid rgba(255,255,255,0.12)'
    : themeColors.isDark
    ? '1px solid rgba(255,255,255,0.08)'
    : '1px solid rgba(255,255,255,0.8)';

  // Auto-scale font
  const quoteLen = quote.length;
  const quoteFontSize = quoteLen > 200 ? theme.fontSize.h3 : quoteLen > 120 ? theme.fontSize.h2 : theme.fontSize.h1;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: theme.fonts.heading,
      }}
    >
      {/* Background: AI image or gradient */}
      {hasImage ? (
        <AnimatedImage
          src={imageUrl!}
          width={SLIDE_WIDTH}
          height={SLIDE_HEIGHT}
          kenBurns="in"
          kenBurnsDrift="left"
          animateEntrance={false}
          vignetteOpacity={0.55}
          overlayGradient="linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.5) 100%)"
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        />
      ) : (
        <DynamicBackground themeColors={themeColors} />
      )}

      {/* Quote content card */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          background: cardBg,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: cardBorder,
          borderRadius: theme.borderRadius.xl,
          padding: `${theme.spacing.xl}px ${theme.spacing.xl * 1.2}px`,
          width: '80%',
          maxWidth: 940,
          textAlign: 'center',
          transform: `translateY(${floatY}px)`,
          boxShadow: hasImage ? '0 16px 50px rgba(0,0,0,0.3)' : theme.shadow.elevated,
        }}
      >
        {/* Giant quote mark */}
        <div
          style={{
            fontSize: 160,
            fontWeight: 900,
            color: quoteMarkColor,
            lineHeight: 0.6,
            marginBottom: -20,
            opacity: quoteMarkOpacity,
            transform: `scale(${quoteMarkScale})`,
            userSelect: 'none',
          }}
        >
          "
        </div>

        {/* Quote text */}
        <p
          style={{
            fontSize: quoteFontSize,
            fontWeight: 600,
            fontStyle: 'italic',
            color: textColor,
            lineHeight: 1.4,
            letterSpacing: -0.5,
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            margin: 0,
            marginBottom: theme.spacing.lg,
            textShadow: hasImage ? '0 2px 15px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          {quote}
        </p>

        {/* Divider line */}
        <div
          style={{
            width: 60,
            height: 3,
            background: lineColor,
            borderRadius: theme.borderRadius.pill,
            margin: `0 auto ${theme.spacing.md}px`,
          }}
        />

        {/* Author */}
        {author && (
          <p
            style={{
              fontSize: theme.fontSize.body,
              fontWeight: 700,
              color: authorColor,
              opacity: authorOpacity,
              transform: `translateY(${authorY}px)`,
              margin: 0,
              letterSpacing: 1,
              textTransform: 'uppercase',
              fontFamily: theme.fonts.body,
              textShadow: hasImage ? '0 1px 8px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            — {author}
          </p>
        )}
      </div>
    </div>
  );
};
