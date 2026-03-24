/**
 * Icons — Centralised SVG icon library
 * ──────────────────────────────────────
 * All icons are pure SVG, theme-aware via currentColor.
 * Size defaults to 16×16; pass size prop to override.
 * No emoji anywhere in the app — use these exclusively.
 */

import { memo } from 'react';

export interface IconProps {
  size?:      number;
  color?:     string;
  className?: string;
  style?:     React.CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
}

const base = (size: number, color?: string): React.SVGProps<SVGSVGElement> => ({
  width:    size,
  height:   size,
  viewBox:  '0 0 24 24',
  fill:     'none',
  stroke:   color ?? 'currentColor',
  strokeWidth:   2,
  strokeLinecap: 'round' as const,
  strokeLinejoin:'round' as const,
  'aria-hidden': true as const,
});

export const IconSun = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1"  x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22"   x2="5.64"  y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1"  y1="12" x2="3"  y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64"  y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
));

export const IconMoon = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
));

export const IconBell = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
));

export const IconSearch = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
));

export const IconX = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6"  y1="6" x2="18" y2="18"/>
  </svg>
));

export const IconCheck = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
));

export const IconCheckCircle = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
));

export const IconAlertTriangle = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
));

export const IconInfo = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
));

export const IconLoader = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={{ animation:'spin 1s linear infinite', ...style }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
));

export const IconEdit = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
));

export const IconSave = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
));

export const IconMapPin = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
));

export const IconDollar = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
));

export const IconClipboard = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
));

export const IconCheckSquare = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
));

export const IconTarget = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
));

export const IconTool = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
));

export const IconLink = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
));

export const IconCalendar = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8"  y1="2" x2="8"  y2="6"/>
    <line x1="3"  y1="10" x2="21" y2="10"/>
  </svg>
));

export const IconStar = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
));

export const IconUser = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
));

export const IconUsers = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
));

export const IconFileText = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
));

export const IconBarChart = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
    <line x1="2"  y1="20" x2="22" y2="20"/>
  </svg>
));

export const IconBriefcase = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
));

export const IconGraduationCap = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
));

export const IconMic = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8"  y1="23" x2="16" y2="23"/>
  </svg>
));

export const IconMessageCircle = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
));

export const IconZap = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
));

export const IconTrendingDown = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
));

export const IconTag = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
));

export const IconLightbulb = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <line x1="9" y1="18" x2="15" y2="18"/>
    <line x1="10" y1="22" x2="14" y2="22"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
));

export const IconPaperclip = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
));

export const IconCpu = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <rect x="9" y="9" width="6" height="6"/>
    <line x1="9"  y1="1"  x2="9"  y2="4"/>
    <line x1="15" y1="1"  x2="15" y2="4"/>
    <line x1="9"  y1="20" x2="9"  y2="23"/>
    <line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9"  x2="23" y2="9"/>
    <line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1"  y1="9"  x2="4"  y2="9"/>
    <line x1="1"  y1="14" x2="4"  y2="14"/>
  </svg>
));

export const IconArrowRight = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
));

export const IconChevronRight = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
));

export const IconChevronUp = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <polyline points="18 15 12 9 6 15"/>
  </svg>
));

export const IconCircle = memo(({ size = 8, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <circle cx="12" cy="12" r="10"/>
  </svg>
));

export const IconMail = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
));

export const IconSettings = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
));

export const IconRefreshCw = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <polyline points="23 4 23 10 17 10"/>
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
));

export const IconSparkle = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"/>
    <path d="M5 3L5.75 5.25L8 6L5.75 6.75L5 9L4.25 6.75L2 6L4.25 5.25L5 3Z"/>
  </svg>
));

export const IconActivity = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
));

export const IconPlus = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
));

export const IconSend = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
));

export const IconHuggingFace = memo(({ size = 16, color, style }: IconProps) => (
  // Simplified HF-style icon — a face in a square
  <svg {...base(size, color)} style={style}>
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <circle cx="9"  cy="10" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none"/>
    <path d="M8 15c1 2 7 2 8 0" strokeLinecap="round"/>
  </svg>
));

export const IconNotepad = memo(({ size = 16, color, style }: IconProps) => (
  <svg {...base(size, color)} style={style}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9"  x2="8" y2="9"/>
  </svg>
));
