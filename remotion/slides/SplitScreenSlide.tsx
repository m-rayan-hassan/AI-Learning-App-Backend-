import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface SplitScreenSlideProps {
  title: string;
  bullets: string[];
  imagePrompt?: string;
}

export const SplitScreenSlide: React.FC<SplitScreenSlideProps> = ({ title, bullets, imagePrompt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Left Image reveals from side
  const imageSpring = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });
  const imageX = interpolate(imageSpring, [0, 1], [-SLIDE_WIDTH * 0.6, 0]);

  // Right Glass Panel slides in
  const panelSpring = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 70 } });
  const panelX = interpolate(panelSpring, [0, 1], [SLIDE_WIDTH * 0.4, 0]);
  const panelOpacity = interpolate(panelSpring, [0, 1], [0, 1]);

  // Fast pure-CSS abstract placeholder based on prompt hash (zero network footprint)
  const hash = (imagePrompt || 'default').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue1 = (hash * 37) % 360;
  const hue2 = (hue1 + 45) % 360;
  const hue3 = (hue2 + 45) % 360;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.fonts.heading,
      }}
    >
      {/* Fallback pattern behind the image */}
      <DynamicBackground />

      {/* Massive 60% Image Section */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '60%',
          transform: `translateX(${imageX}px)`,
          zIndex: 5,
          background: `linear-gradient(135deg, hsl(${hue1}, 70%, 20%) 0%, hsl(${hue2}, 80%, 30%) 50%, hsl(${hue3}, 70%, 15%) 100%)`,
          boxShadow: '10px 0 50px rgba(0,0,0,0.15)',
        }}
      >
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 30% 30%, hsl(${hue1}, 70%, 40%) 0%, transparent 50%)`,
          }}
        />
        {/* Soft gradient fade on the edge to blend nicely */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, transparent 80%, rgba(248, 250, 252, 0.5) 100%)',
        }} />
      </div>

      {/* 40% Glass Panel Overlapping the image slightly */}
      <div
        style={{
          position: 'absolute',
          right: theme.spacing.xl,
          top: theme.spacing.xl,
          bottom: theme.spacing.xl,
          width: '45%', // Deliberate overlap over the image
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: theme.borderRadius.xl,
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: theme.shadow.elevated,
          transform: `translateX(${panelX}px)`,
          opacity: panelOpacity,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: theme.spacing.lg,
        }}
      >
        <h2
          style={{
            fontSize: theme.fontSize.h1 * 0.9,
            fontWeight: 800,
            color: theme.colors.textPrimary,
            lineHeight: 1.15,
            letterSpacing: -1,
            margin: 0,
            marginBottom: theme.spacing.lg,
          }}
        >
          {title}
        </h2>

        {bullets.map((bullet, i) => {
          const bSpring = spring({ frame: frame - 25 - (i * 8), fps, config: { damping: 14, stiffness: 80 } });
          const bY = interpolate(bSpring, [0, 1], [20, 0]);
          const bOpacity = interpolate(bSpring, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.md,
                transform: `translateY(${bY}px)`,
                opacity: bOpacity,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: `${theme.colors.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.colors.primary }} />
              </div>
              <p
                style={{
                  fontSize: theme.fontSize.body,
                  color: theme.colors.textSecondary,
                  margin: 0,
                  lineHeight: 1.4,
                  fontWeight: 500,
                  fontFamily: theme.fonts.body,
                }}
              >
                {bullet}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
