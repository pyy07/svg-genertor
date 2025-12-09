import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SVG 动画生成器',
  description: '根据自然语言描述生成 SVG 动画',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

