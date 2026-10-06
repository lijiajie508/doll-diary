import type { CSSProperties } from 'react'

interface IconProps {
  size?: number
  color?: string
  style?: CSSProperties
}

/**
 * 统一线条风格图标（Lucide 风格，描边 2，圆角端点）
 */
function Svg({ size = 20, color = '#555', style, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {children}
    </svg>
  )
}

/** 私信：对话气泡 */
export function MessageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  )
}

/** 搜索：放大镜 */
export function SearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  )
}

/** 通知：铃铛 */
export function BellIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Svg>
  )
}

/** 首页：小房子 */
export function HomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  )
}

/** 展示柜：柜子 */
export function CabinetIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
    </Svg>
  )
}

/** 个人主页：人像 */
export function ProfileIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Svg>
  )
}
