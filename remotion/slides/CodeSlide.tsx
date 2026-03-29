import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface CodeSlideProps {
  title: string;
  code: string;
  language?: string;
  explanation?: string;
}

export const CodeSlide: React.FC<CodeSlideProps> = ({ title, code, language, explanation }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  // Code window
  const windowSpring = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 70 } });
  const windowOpacity = interpolate(windowSpring, [0, 1], [0, 1]);
  const windowScale = interpolate(windowSpring, [0, 1], [0.95, 1]);

  // Explanation
  const expSpring = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 80 } });
  const expOpacity = interpolate(expSpring, [0, 1], [0, 1]);
  const expX = interpolate(expSpring, [0, 1], [40, 0]);

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        padding: `${theme.spacing.lg}px ${theme.spacing.xl}px`,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.fonts.heading,
      }}
    >
      <DynamicBackground />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Title */}
        <h2
          style={{
            fontSize: theme.fontSize.hero * 0.75,
            fontWeight: 800,
            color: theme.colors.textPrimary,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            margin: 0,
            marginBottom: theme.spacing.lg,
            letterSpacing: -1,
          }}
        >
          {title}
        </h2>

        <div style={{ display: 'flex', gap: theme.spacing.xxl, flex: 1, alignItems: 'center' }}>
          {/* Mac-Style Glass Code Editor Window */}
          <div
            style={{
              flex: explanation ? 2 : 1,
              background: 'rgba(15, 23, 42, 0.85)', // Very dark slate glass
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: theme.borderRadius.xl,
              boxShadow: theme.shadow.elevated,
              border: '1px solid rgba(255,255,255,0.15)',
              opacity: windowOpacity,
              transform: `scale(${windowScale})`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Window header */}
            <div
              style={{
                height: 56,
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 24px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ff5f56', boxShadow: '0 0 5px rgba(255,95,86,0.5)' }} />
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#ffbd2e', boxShadow: '0 0 5px rgba(255,189,46,0.5)' }} />
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#27c93f', boxShadow: '0 0 5px rgba(39,201,63,0.5)' }} />
              </div>
              {language && (
                <div
                  style={{
                    marginLeft: 'auto',
                    fontSize: 16,
                    color: '#94a3b8', // subtle slate text
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    fontWeight: 700,
                  }}
                >
                  {language}
                </div>
              )}
            </div>

            {/* Code Content */}
            <div
              style={{
                padding: theme.spacing.lg,
                fontFamily: theme.fonts.mono,
                fontSize: 20, // slightly smaller code font
                color: '#f8fafc',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                textShadow: '0 2px 5px rgba(0,0,0,0.3)',
              }}
            >
              {code}
            </div>
          </div>

          {/* Explanation (Right side Panel) */}
          {explanation && (
            <div
              style={{
                flex: 1,
                opacity: expOpacity,
                transform: `translateX(${expX}px)`,
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.xl,
                border: `1px solid rgba(255,255,255,0.9)`,
                boxShadow: theme.shadow.card,
              }}
            >
              <div style={{ width: 40, height: 4, background: theme.colors.primary, marginBottom: theme.spacing.md, borderRadius: 2 }} />
              <p
                style={{
                  fontSize: theme.fontSize.body,
                  color: theme.colors.textSecondary,
                  margin: 0,
                  lineHeight: 1.6,
                  fontFamily: theme.fonts.body,
                }}
              >
                {explanation}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
