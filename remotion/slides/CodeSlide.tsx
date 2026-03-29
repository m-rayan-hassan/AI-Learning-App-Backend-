import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';
import { theme, SLIDE_WIDTH, SLIDE_HEIGHT } from '../theme';
import type { ThemeColors } from '../theme';
import { DynamicBackground } from '../components/DynamicBackground';

interface CodeSlideProps {
  title: string;
  code: string;
  language?: string;
  explanation?: string;
  themeColors: ThemeColors;
}

/** Basic syntax coloring via regex — must be pure functions, no external libs */
const colorizeCode = (code: string, language?: string): React.ReactNode[] => {
  // Keyword sets for common languages
  const keywords = new Set([
    'function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'class',
    'import', 'export', 'from', 'default', 'new', 'this', 'async', 'await', 'try', 'catch',
    'throw', 'extends', 'implements', 'interface', 'type', 'enum', 'struct',
    'def', 'self', 'print', 'True', 'False', 'None', 'in', 'not', 'and', 'or',
    'public', 'private', 'static', 'void', 'int', 'string', 'bool', 'float', 'double',
  ]);

  const lines = code.split('\n');
  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    // Simple tokenizer
    const tokens = line.split(/(\s+|[{}()\[\];,:.=<>+\-*/]|"[^"]*"|'[^']*'|\/\/.*$|#.*$)/g);
    tokens.forEach((token, tokenIdx) => {
      const key = `${lineIdx}-${tokenIdx}`;
      if (!token) return;
      // Comments
      if (token.startsWith('//') || token.startsWith('#')) {
        parts.push(<span key={key} style={{ color: '#6b7280', fontStyle: 'italic' }}>{token}</span>);
      }
      // Strings
      else if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
        parts.push(<span key={key} style={{ color: '#34d399' }}>{token}</span>);
      }
      // Numbers
      else if (/^\d+(\.\d+)?$/.test(token)) {
        parts.push(<span key={key} style={{ color: '#f59e0b' }}>{token}</span>);
      }
      // Keywords
      else if (keywords.has(token)) {
        parts.push(<span key={key} style={{ color: '#818cf8', fontWeight: 600 }}>{token}</span>);
      }
      // Operators & punctuation
      else if (/^[{}()\[\];,:.=<>+\-*/]+$/.test(token)) {
        parts.push(<span key={key} style={{ color: '#94a3b8' }}>{token}</span>);
      }
      // Default
      else {
        parts.push(<span key={key}>{token}</span>);
      }
    });
    return (
      <div key={lineIdx} style={{ display: 'flex' }}>
        <span style={{ color: '#475569', width: 40, textAlign: 'right', marginRight: 16, userSelect: 'none', fontSize: 14, flexShrink: 0, paddingTop: 2 }}>
          {lineIdx + 1}
        </span>
        <span>{parts}</span>
      </div>
    );
  });
};

export const CodeSlide: React.FC<CodeSlideProps> = ({ title, code, language, explanation, themeColors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleY = interpolate(titleSpring, [0, 1], [30, 0]);

  const windowSpring = spring({ frame: frame - 15, fps, config: { damping: 12, stiffness: 70 } });
  const windowOpacity = interpolate(windowSpring, [0, 1], [0, 1]);
  const windowScale = interpolate(windowSpring, [0, 1], [0.95, 1]);

  const expSpring = spring({ frame: frame - 30, fps, config: { damping: 14, stiffness: 80 } });
  const expOpacity = interpolate(expSpring, [0, 1], [0, 1]);
  const expX = interpolate(expSpring, [0, 1], [40, 0]);

  // Auto-scale code font
  const lineCount = code.split('\n').length;
  const codeFontSize = lineCount > 15 ? 14 : lineCount > 10 ? 16 : 18;

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
      <DynamicBackground themeColors={themeColors} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <h2
          style={{
            fontSize: title.length > 40 ? theme.fontSize.h2 : theme.fontSize.hero * 0.75,
            fontWeight: 800,
            color: themeColors.textPrimary,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            margin: 0,
            marginBottom: theme.spacing.md,
            letterSpacing: -1,
          }}
        >
          {title}
        </h2>

        <div style={{ display: 'flex', gap: theme.spacing.lg, flex: 1, alignItems: 'center' }}>
          {/* Code window */}
          <div
            style={{
              flex: explanation ? 2 : 1,
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              borderRadius: theme.borderRadius.xl,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              opacity: windowOpacity,
              transform: `scale(${windowScale})`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              maxHeight: explanation ? 500 : 560,
            }}
          >
            {/* macOS window header */}
            <div
              style={{
                height: 48,
                background: 'rgba(255,255,255,0.04)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f' }} />
              </div>
              {language && (
                <div
                  style={{
                    marginLeft: 'auto',
                    fontSize: 14,
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    fontWeight: 700,
                    fontFamily: theme.fonts.mono,
                  }}
                >
                  {language}
                </div>
              )}
            </div>

            {/* Syntax-highlighted code */}
            <div
              style={{
                padding: theme.spacing.md,
                fontFamily: theme.fonts.mono,
                fontSize: codeFontSize,
                color: '#e2e8f0',
                lineHeight: 1.7,
                overflow: 'hidden',
              }}
            >
              {colorizeCode(code, language)}
            </div>
          </div>

          {/* Explanation panel */}
          {explanation && (
            <div
              style={{
                flex: 1,
                opacity: expOpacity,
                transform: `translateX(${expX}px)`,
                background: themeColors.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.lg,
                border: themeColors.isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.9)',
                boxShadow: theme.shadow.card,
              }}
            >
              <div style={{ width: 40, height: 4, background: themeColors.primary, marginBottom: theme.spacing.md, borderRadius: 2 }} />
              <p
                style={{
                  fontSize: theme.fontSize.body,
                  color: themeColors.textSecondary,
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
