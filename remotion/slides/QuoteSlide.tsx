import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';

interface QuoteSlideProps {
  quote: string;
  author?: string;
  imagePrompt?: string;
  themeColors: ThemeColors;
}

export const QuoteSlide: React.FC<QuoteSlideProps> = ({ quote, author, imagePrompt, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const quoteMarkSpring = spring({ frame, fps, config: { damping: 12, stiffness: 60 } });
  const quoteMarkScale = interpolate(quoteMarkSpring, [0, 1], [0, 1]);
  const quoteMarkOpacity = interpolate(quoteMarkSpring, [0, 1], [0, 0.35]);

  const textSpring = spring({ frame: frame - 15, fps, config: { damping: 16, stiffness: 80 } });
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);
  const textY = interpolate(textSpring, [0, 1], [40, 0]);

  const authorSpring = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 70 } });
  const authorOpacity = interpolate(authorSpring, [0, 1], [0, 1]);
  const authorY = interpolate(authorSpring, [0, 1], [20, 0]);

  const hash = (imagePrompt || 'default').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue1 = (hash * 43) % 360;
  const hue2 = (hue1 + 60) % 360;

  // Slow parallax drift
  const driftX = interpolate(frame, [0, 300], [0, -10], { extrapolateRight: 'clamp' });
  const driftScale = interpolate(frame, [0, 300], [1, 1.08], { extrapolateRight: 'clamp' });

  // Auto-scale quote for long strings
  const quoteLen = quote.length;
  const quoteFontSize = quoteLen > 200 ? theme.fontSize.h2 : quoteLen > 120 ? theme.fontSize.h1 : theme.fontSize.hero * 1.1;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.fonts.heading,
        padding: theme.spacing.xl * 2,
      }}
    >
      {/* Rich cinematic background */}
      <div
        style={{
          position: 'absolute',
          inset: -20,
          background: `radial-gradient(ellipse at 50% 50%, hsl(${hue1}, 25%, 25%) 0%, hsl(${hue2}, 30%, 8%) 100%)`,
          zIndex: 0,
          transform: `translateX(${driftX}px) scale(${driftScale})`,
        }}
      />
      {/* Accent light */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${themeColors.primary}20 0%, transparent 60%)`,
          top: '20%',
          left: '15%',
          zIndex: 0,
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.85) 100%)',
          zIndex: 1,
        }}
      />

      {/* Giant quotation mark */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${quoteMarkScale})`,
          fontSize: 700,
          fontWeight: 900,
          fontFamily: 'Georgia, serif',
          color: themeColors.primary,
          opacity: quoteMarkOpacity,
          lineHeight: 1,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        "
      </div>

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 1100 }}>
        <h2
          style={{
            fontSize: quoteFontSize,
            fontWeight: 700,
            color: '#ffffff',
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
            lineHeight: 1.3,
            letterSpacing: -1,
            margin: 0,
            fontFamily: '"Plus Jakarta Sans", serif',
            textShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          "{quote}"
        </h2>

        {author && (
          <div
            style={{
              marginTop: theme.spacing.xl * 1.5,
              opacity: authorOpacity,
              transform: `translateY(${authorY}px)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.spacing.md,
            }}
          >
            <div style={{ width: 60, height: 3, background: themeColors.primary }} />
            <p
              style={{
                fontSize: theme.fontSize.h2,
                fontWeight: 700,
                color: themeColors.primaryLight,
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: 4,
                textShadow: '0 4px 10px rgba(0,0,0,0.5)',
              }}
            >
              {author}
            </p>
            <div style={{ width: 60, height: 3, background: themeColors.primary }} />
          </div>
        )}
      </div>
    </div>
  );
};
