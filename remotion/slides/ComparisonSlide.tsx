import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface Column {
  heading: string;
  items: string[];
}

interface ComparisonSlideProps {
  title: string;
  columns: Column[];
  themeColors: ThemeColors;
}

export const ComparisonSlide: React.FC<ComparisonSlideProps> = ({ title, columns, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  // Support 2, 3, or 4 columns — no hard cap
  const safeColumns = columns.slice(0, 4);
  const colCount = safeColumns.length;

  // Adaptive sizing
  const headerFontSize = colCount > 2 ? theme.fontSize.h3 : theme.fontSize.h2;
  const itemFontSize = colCount > 3 ? theme.fontSize.small - 2 : colCount > 2 ? theme.fontSize.small : theme.fontSize.body;
  const itemPadX = colCount > 2 ? theme.spacing.sm : theme.spacing.lg;
  const itemPadY = colCount > 2 ? theme.spacing.sm : theme.spacing.md;
  const maxItemsPerCol = colCount > 2 ? 4 : 5;
  const titleFontSize = title.length > 40 ? theme.fontSize.h2 : theme.fontSize.hero * 0.9;

  const cardBg = themeColors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';
  const cardBorder = themeColors.isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.9)';
  const itemBg = themeColors.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.8)';
  const itemBorder = themeColors.isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.9)';

  // Accent colors per column
  const colAccents = [themeColors.secondary, themeColors.primary, themeColors.accent, themeColors.secondaryLight];

  return (
    <div
      style={{
        boxSizing: 'border-box',
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `${theme.spacing.lg}px ${theme.spacing.xl}px`,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: theme.fonts.heading,
      }}
    >
      <DynamicBackground themeColors={themeColors} />

      <h2
        style={{
          position: 'relative',
          zIndex: 10,
          fontSize: titleFontSize,
          fontWeight: 800,
          color: themeColors.textPrimary,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
          letterSpacing: -1,
          margin: 0,
          marginBottom: theme.spacing.md,
        }}
      >
        {title}
      </h2>

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          gap: colCount > 3 ? theme.spacing.sm : theme.spacing.md,
          width: '100%',
          maxWidth: 1160,
          flex: 1,
          paddingBottom: theme.spacing.md,
        }}
      >
        {safeColumns.map((col, i) => {
          const delay = 15 + i * 12;
          const cardSpring = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 60 } });
          const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
          const cardY = interpolate(cardSpring, [0, 1], [50, 0]);

          const isPrimary = i === 1;
          const headerGradient = isPrimary ? themeColors.gradientPrimary : themeColors.gradientCard;
          const headerTextColor = isPrimary ? '#ffffff' : themeColors.textPrimary;
          const colAccent = colAccents[i % colAccents.length];

          return (
            <div
              key={i}
              style={{
                flex: 1,
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                background: cardBg,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: theme.borderRadius.xl,
                boxShadow: theme.shadow.elevated,
                border: cardBorder,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Header */}
              <div
                style={{
                  background: headerGradient,
                  padding: `${colCount > 2 ? theme.spacing.md : theme.spacing.lg}px`,
                  textAlign: 'center',
                  borderBottom: themeColors.isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.05)',
                }}
              >
                <h3
                  style={{
                    fontSize: headerFontSize,
                    fontWeight: 800,
                    color: headerTextColor,
                    margin: 0,
                    letterSpacing: -1,
                  }}
                >
                  {col.heading}
                </h3>
              </div>

              {/* Items */}
              <div style={{ padding: colCount > 2 ? theme.spacing.sm : theme.spacing.lg, flex: 1, display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, overflow: 'hidden' }}>
                {col.items.slice(0, maxItemsPerCol).map((item, j) => {
                  const itemDelay = delay + 10 + j * 6;
                  const itemSpring = spring({ frame: frame - itemDelay, fps, config: { damping: 14, stiffness: 80 } });
                  const itemOpacity = interpolate(itemSpring, [0, 1], [0, 1]);
                  const itemX = interpolate(itemSpring, [0, 1], [-20, 0]);

                  return (
                    <div
                      key={j}
                      style={{
                        opacity: itemOpacity,
                        transform: `translateX(${itemX}px)`,
                        background: itemBg,
                        padding: `${itemPadY}px ${itemPadX}px`,
                        borderRadius: theme.borderRadius.md,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm,
                        border: itemBorder,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: colAccent,
                          flexShrink: 0,
                          boxShadow: `0 0 8px ${colAccent}40`,
                        }}
                      />
                      <p
                        style={{
                          fontSize: itemFontSize,
                          color: themeColors.textSecondary,
                          margin: 0,
                          lineHeight: 1.35,
                          fontWeight: 500,
                          fontFamily: theme.fonts.body,
                        }}
                      >
                        {item}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* VS Badge — only for 2-column */}
        {safeColumns.length === 2 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) scale(${interpolate(spring({ frame: frame - 40, fps, config: { damping: 12, stiffness: 60 } }), [0, 1], [0, 1])})`,
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: themeColors.isDark ? 'rgba(30,30,50,0.9)' : '#ffffff',
              boxShadow: theme.shadow.elevated,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: themeColors.isDark ? `3px solid ${themeColors.primary}` : `4px solid ${themeColors.bgCardAlt}`,
              zIndex: 20,
              fontSize: 22,
              fontWeight: 900,
              color: themeColors.primary,
              letterSpacing: 1,
            }}
          >
            VS
          </div>
        )}
      </div>
    </div>
  );
};
