import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface SplitScreenSlideProps {
  title: string;
  bullets: string[];
  imagePrompt?: string;
  themeColors: ThemeColors;
}

export const SplitScreenSlide: React.FC<SplitScreenSlideProps> = ({ title, bullets, imagePrompt, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imageSpring = spring({ frame, fps, config: { damping: 14, stiffness: 70 } });
  const imageX = interpolate(imageSpring, [0, 1], [-SLIDE_WIDTH * 0.6, 0]);

  const panelSpring = spring({ frame: frame - 15, fps, config: { damping: 14, stiffness: 70 } });
  const panelX = interpolate(panelSpring, [0, 1], [SLIDE_WIDTH * 0.4, 0]);
  const panelOpacity = interpolate(panelSpring, [0, 1], [0, 1]);

  // Rich abstract visual from imagePrompt
  const hash = (imagePrompt || 'default').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue1 = (hash * 37) % 360;
  const hue2 = (hue1 + 45) % 360;
  const hue3 = (hue2 + 45) % 360;

  // Animate Ken Burns effect on the image section
  const kbScale = interpolate(frame, [0, 300], [1.0, 1.15], { extrapolateRight: 'clamp' });
  const kbX = interpolate(frame, [0, 300], [0, -20], { extrapolateRight: 'clamp' });

  const panelBg = themeColors.isDark ? 'rgba(20,20,35,0.88)' : 'rgba(255,255,255,0.88)';
  const panelBorder = themeColors.isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.9)';
  const bulletBg = themeColors.isDark ? `${themeColors.primary}15` : `${themeColors.primary}15`;

  const safeBullets = bullets.slice(0, 6);

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
      <DynamicBackground themeColors={themeColors} />

      {/* 60% Visual section with rich gradients + geometric shapes */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '60%',
          transform: `translateX(${imageX}px) scale(${kbScale}) translateX(${kbX}px)`,
          transformOrigin: 'center center',
          zIndex: 5,
          background: `linear-gradient(135deg, hsl(${hue1}, 70%, ${themeColors.isDark ? 15 : 20}%) 0%, hsl(${hue2}, 80%, ${themeColors.isDark ? 20 : 30}%) 50%, hsl(${hue3}, 70%, ${themeColors.isDark ? 12 : 15}%) 100%)`,
          boxShadow: '10px 0 50px rgba(0,0,0,0.2)',
        }}
      >
        {/* Light orb */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 30% 30%, hsl(${hue1}, 70%, 45%) 0%, transparent 50%)`,
          }}
        />
        {/* Secondary orb */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 70% 70%, hsl(${hue2}, 60%, 35%) 0%, transparent 40%)`,
          }}
        />
        {/* Geometric accent */}
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            border: `2px solid rgba(255,255,255,0.15)`,
            bottom: -80,
            left: -80,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '30%',
            border: `2px solid rgba(255,255,255,0.1)`,
            top: 60,
            right: 60,
            transform: 'rotate(45deg)',
          }}
        />
        {/* Edge blend */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(to right, transparent 75%, ${themeColors.bg}80 100%)`,
        }} />
      </div>

      {/* Glass panel */}
      <div
        style={{
          position: 'absolute',
          right: theme.spacing.xl,
          top: theme.spacing.xl,
          bottom: theme.spacing.xl,
          width: '45%',
          background: panelBg,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: theme.borderRadius.xl,
          border: panelBorder,
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
            fontSize: title.length > 30 ? theme.fontSize.h2 : theme.fontSize.h1 * 0.9,
            fontWeight: 800,
            color: themeColors.textPrimary,
            lineHeight: 1.15,
            letterSpacing: -1,
            margin: 0,
            marginBottom: theme.spacing.lg,
          }}
        >
          {title}
        </h2>

        {safeBullets.map((bullet, i) => {
          const bSpring = spring({ frame: frame - 25 - (i * 6), fps, config: { damping: 14, stiffness: 80 } });
          const bY = interpolate(bSpring, [0, 1], [20, 0]);
          const bOpacity = interpolate(bSpring, [0, 1], [0, 1]);

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
                transform: `translateY(${bY}px)`,
                opacity: bOpacity,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: bulletBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: themeColors.primary }} />
              </div>
              <p
                style={{
                  fontSize: safeBullets.length > 5 ? theme.fontSize.small : theme.fontSize.body,
                  color: themeColors.textSecondary,
                  margin: 0,
                  lineHeight: 1.35,
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
