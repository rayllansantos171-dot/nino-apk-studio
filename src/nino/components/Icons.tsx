import React from "react";

type P = { size?: number; className?: string };

const base = (size = 22) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconAgent = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="4" y="5" width="16" height="14" rx="3" />
    <path d="M9 11v2M15 11v2M2 11v3M22 11v3M12 5V3" />
  </svg>
);
export const IconPalette = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.6-1-1.8-1-3 0-1 .8-2 2-2h2a4 4 0 0 0 4-4c0-4-4-7-9-7z" />
    <circle cx="7.5" cy="11" r="1" />
    <circle cx="10" cy="7.5" r="1" />
    <circle cx="14.5" cy="7.5" r="1" />
  </svg>
);
export const IconSettings = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
export const IconRocket = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2" />
    <path d="M12 15 9 12a22 22 0 0 1 2-4c2-3 5-5 10-5 0 5-2 8-5 10a22 22 0 0 1-4 2z" />
    <circle cx="16" cy="8" r="1.5" />
  </svg>
);
export const IconMove = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" />
  </svg>
);
export const IconChat = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
    <path d="M9 11h.01M12 11h.01M15 11h.01" />
  </svg>
);
export const IconCube = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3 4 7.5v9L12 21l8-4.5v-9z" />
    <path d="M4 7.5 12 12l8-4.5M12 12v9" />
  </svg>
);
export const IconShield = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" />
  </svg>
);
export const IconBell = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);
export const IconHeart = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.500-9 9-9 9z" />
  </svg>
);
export const IconVolume = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 10v4h4l5 4V6L8 10z" />
    <path d="M16 9a4 4 0 0 1 0 6M18.500 6.500a8 8 0 0 1 0 11" />
  </svg>
);
export const IconInfo = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);
export const IconSparkle = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l1.8 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800z" />
  </svg>
);
export const IconDots = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="6" cy="12" r="1.200" />
    <circle cx="12" cy="12" r="1.200" />
    <circle cx="18" cy="12" r="1.200" />
  </svg>
);
export const IconFoot = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M7 20c-1 0-2-1-2-2.500S6 14 7 12c1-3 1-7 4-7s3 3 3 6c0 2 4 3 4 6s-1 3-3 3z" />
  </svg>
);
export const IconSlow = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M20 14a8 8 0 1 1-8-8" />
    <path d="M12 3v3M12 12l3-2" />
  </svg>
);
export const IconBolt = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M13 3 5 14h6l-1 7 8-11h-6z" />
  </svg>
);
export const IconNormal = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);
export const IconSize = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 20h16M4 20V8M8 20V4M12 20v-6M16 20V10" />
  </svg>
);
export const IconBack = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const IconChevron = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);
export const IconSend = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M21 3 3 10.500l7 3 3 7z" />
    <path d="M10 13.500 21 3" />
  </svg>
);
export const IconSmile = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.500 14a4 4 0 0 0 7 0M9 9.500h.01M15 9.500h.01" />
  </svg>
);
export const IconRefresh = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M20 11a8 8 0 0 0-14.500-3.500M4 4v4h4M4 13a8 8 0 0 0 14.500 3.500M20 20v-4h-4" />
  </svg>
);
export const IconGlobe = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
  </svg>
);
export const IconHand = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M18 11V6a1.5 1.5 0 0 0-3 0v4M15 10V4.5a1.5 1.5 0 0 0-3 0V10M12 10V5.500a1.5 1.5 0 0 0-3 0V12M9 12V9a1.5 1.5 0 0 0-3 0v6a7 7 0 0 0 7 7h1a6 6 0 0 0 6-6v-5a1.5 1.5 0 0 0-3 0" />
  </svg>
);
export const IconFist = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 12V9a1.5 1.5 0 0 1 3 0M9 9V8a1.5 1.5 0 0 1 3 0M12 8a1.5 1.5 0 0 1 3 0v1M15 9a1.5 1.5 0 0 1 3 0v6a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-1.500-2.500a1.5 1.5 0 0 1 2.500-1.500L8 15" />
  </svg>
);
export const IconCrown =({ size, className }: P) => (
  <svg width={size ?? 22} height={size ?? 22} viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M3 18V8l5 4 4-7 4 7 5-4v10z" />
  </svg>
);

export const IconLock = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="5" y="11" width="14" height="9" rx="2.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    <path d="M12 15v2" />
  </svg>
);
export const IconStore = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4.5 4h15l1.5 5H3l1.5-5z" />
    <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
    <path d="M5 11.6V20h14v-8.4" />
    <path d="M10 20v-5h4v5" />
  </svg>
);
