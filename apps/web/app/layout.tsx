import type { Metadata } from 'next'
import { Bebas_Neue } from 'next/font/google'
import './globals.css'
import { Providers } from './Providers'

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-events' })

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
      <body className={bebasNeue.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
