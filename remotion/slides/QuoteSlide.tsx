import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';

interface QuoteSlideProps {
  quote: string;
  author?: string;
  imagePrompt?: string; // We map this to a background
}

export const QuoteSlide: React.FC<QuoteSlideProps> = ({ quote, author, imagePrompt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Quote mark animation
  const quoteMarkSpring = spring({ frame, fps, config: { damping: 12, stiffness: 60 } });
  const quoteMarkScale = interpolate(quoteMarkSpring, [0, 1], [0, 1]);
  const quoteMarkOpacity = interpolate(quoteMarkSpring, [0, 1], [0, 0.4]); 

  // Text animation
  const textSpring = spring({ frame: frame - 15, fps, config: { damping: 16, stiffness: 80 } });
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);
  const textY = interpolate(textSpring, [0, 1], [40, 0]);

  // Author animation
  const authorSpring = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 70 } });
  const authorOpacity = interpolate(authorSpring, [0, 1], [0, 1]);
  const authorY = interpolate(authorSpring, [0, 1], [20, 0]);

  // Fast pure-CSS cinematic background (zero network footprint)
  const hash = (imagePrompt || 'default').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue1 = (hash * 43) % 360;
  const hue2 = (hue1 + 60) % 360;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        background: '#0a0a0a', // Solid dark behind image
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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, hsl(${hue1}, 20%, 25%) 0%, hsl(${hue2}, 30%, 10%) 100%)`,
          zIndex: 0,
        }}
      />
      {/* Cinematic dark vignette overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, transparent 20%, rgba(0,0,0,0.85) 100%)',
          zIndex: 1,
        }}
      />

      {/* Giant stylistic quote mark in background */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${quoteMarkScale})`,
          fontSize: 800,
          fontWeight: 900,
          fontFamily: 'Georgia, serif',
          color: theme.colors.primary,
          opacity: quoteMarkOpacity,
          lineHeight: 1,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        "
      </div>

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: 1200 }}>
        {/* The Quote itself */}
        <h2
          style={{
            fontSize: theme.fontSize.hero * 1.1,
            fontWeight: 700,
            color: '#ffffff', // Force white for cinematic image background
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

        {/* The Author (optional) */}
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
            <div style={{ width: 60, height: 3, background: theme.colors.primary }} />
            <p
              style={{
                fontSize: theme.fontSize.h2,
                fontWeight: 700,
                color: theme.colors.primaryLight,
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: 4,
                textShadow: '0 4px 10px rgba(0,0,0,0.5)',
              }}
            >
              {author}
            </p>
            <div style={{ width: 60, height: 3, background: theme.colors.primary }} />
          </div>
        )}
      </div>
    </div>
  );
};
