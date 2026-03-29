import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface TableSlideProps {
  title: string;
  headers: string[];
  rows: string[][];
  themeColors: ThemeColors;
}

export const TableSlide: React.FC<TableSlideProps> = ({ title, headers, rows, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  const tableSpring = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 70 } });
  const tableOpacity = interpolate(tableSpring, [0, 1], [0, 1]);
  const tableScale = interpolate(tableSpring, [0, 1], [0.95, 1]);

  // Limit for overflow
  const safeHeaders = headers.slice(0, 6);
  const safeRows = rows.slice(0, 6);
  const colCount = safeHeaders.length;

  // Auto-scale
  const cellFontSize = colCount > 4 ? theme.fontSize.caption : colCount > 3 ? theme.fontSize.small : theme.fontSize.body;
  const headerFontSize = colCount > 4 ? theme.fontSize.small : theme.fontSize.body;
  const cellPadY = colCount > 4 ? theme.spacing.sm : theme.spacing.md;
  const cellPadX = colCount > 4 ? theme.spacing.sm : theme.spacing.md;

  const headerBg = themeColors.gradientPrimary;
  const rowBgEven = themeColors.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.6)';
  const rowBgOdd = themeColors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)';
  const tableBorder = themeColors.isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)';

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

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', width: '100%' }}>
        <h2
          style={{
            fontSize: title.length > 40 ? theme.fontSize.h2 : theme.fontSize.hero * 0.75,
            fontWeight: 800,
            color: themeColors.textPrimary,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            margin: 0,
            marginBottom: theme.spacing.lg,
            letterSpacing: -1,
            textAlign: 'center',
          }}
        >
          {title}
        </h2>

        {/* Table */}
        <div
          style={{
            width: '100%',
            maxWidth: 1100,
            opacity: tableOpacity,
            transform: `scale(${tableScale})`,
            borderRadius: theme.borderRadius.xl,
            overflow: 'hidden',
            boxShadow: theme.shadow.elevated,
            border: tableBorder,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${colCount}, 1fr)`,
              background: headerBg,
            }}
          >
            {safeHeaders.map((header, i) => (
              <div
                key={i}
                style={{
                  padding: `${cellPadY}px ${cellPadX}px`,
                  textAlign: 'center',
                  borderRight: i < colCount - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none',
                }}
              >
                <span
                  style={{
                    fontSize: headerFontSize,
                    fontWeight: 800,
                    color: '#ffffff',
                    letterSpacing: -0.5,
                  }}
                >
                  {header}
                </span>
              </div>
            ))}
          </div>

          {/* Data rows */}
          {safeRows.map((row, rowIdx) => {
            const rowDelay = 25 + rowIdx * 8;
            const rowSpring = spring({ frame: frame - rowDelay, fps, config: { damping: 14, stiffness: 80 } });
            const rowOpacity = interpolate(rowSpring, [0, 1], [0, 1]);
            const rowX = interpolate(rowSpring, [0, 1], [-30, 0]);

            return (
              <div
                key={rowIdx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                  background: rowIdx % 2 === 0 ? rowBgEven : rowBgOdd,
                  opacity: rowOpacity,
                  transform: `translateX(${rowX}px)`,
                  borderTop: tableBorder,
                }}
              >
                {row.slice(0, colCount).map((cell, cellIdx) => (
                  <div
                    key={cellIdx}
                    style={{
                      padding: `${cellPadY}px ${cellPadX}px`,
                      textAlign: 'center',
                      borderRight: cellIdx < colCount - 1 ? tableBorder : 'none',
                    }}
                  >
                    <span
                      style={{
                        fontSize: cellFontSize,
                        fontWeight: cellIdx === 0 ? 700 : 500,
                        color: cellIdx === 0 ? themeColors.textPrimary : themeColors.textSecondary,
                        fontFamily: theme.fonts.body,
                      }}
                    >
                      {cell}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
