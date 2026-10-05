import React from 'react'

// 버튼에 쓰는 작은 선 아이콘 (글자색을 그대로 따라감)
type IconProps = { className?: string }
const base = (className = 'h-5 w-5') => ({
  className,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const SearchIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const StarIcon = ({ className, filled }: IconProps & { filled?: boolean }) => (
  <svg {...base(className)} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" />
  </svg>
)

export const ShareIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M12 3v12" />
    <path d="m7 8 5-5 5 5" />
    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </svg>
)

export const DownloadIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
)

export const ArrowIcon = ({ className, dir }: IconProps & { dir: 'up' | 'down' | 'left' | 'right' }) => (
  <svg {...base(className)} style={{ transform: `rotate(${{ up: 0, right: 90, down: 180, left: 270 }[dir]}deg)` }}>
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
)

export const PlayIcon = ({ className }: IconProps) => (
  <svg {...base(className)} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.2-6.5a1 1 0 0 0 0-1.7L9.5 4.6A1 1 0 0 0 8 5.5z" />
  </svg>
)

export const PauseIcon = ({ className }: IconProps) => (
  <svg {...base(className)} fill="currentColor" stroke="none">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
)

export const ExternalIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M14 4h6v6" />
    <path d="M20 4 10 14" />
    <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
  </svg>
)

export const MenuIcon = ({ className }: IconProps) => (
  <svg {...base(className)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)
