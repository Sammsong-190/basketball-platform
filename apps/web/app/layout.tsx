import type { Metadata } from 'next'
import { Bebas_Neue } from 'next/font/google'
import './globals.css'
import { Providers } from './Providers'

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-events' })

export const metadata: Metadata = {
  title: '篮球电商与社区平台',
  description: '融合购物、社交与内容的篮球主题平台',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" translate="no" className="notranslate">
      <body className={bebasNeue.variable}>
        <Providers>{children}</Providers>
        <div id="fly-to-cart-portal" suppressHydrationWarning />
      </body>
    </html>
  )
}
