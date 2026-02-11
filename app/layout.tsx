import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '篮球用品电商社交平台',
  description: '整合交易、社交、内容三大功能的篮球用品平台',
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
