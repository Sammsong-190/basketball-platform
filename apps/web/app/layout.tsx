import type { Metadata } from 'next'
import { Bebas_Neue } from 'next/font/google'
import './globals.css'
import { Providers } from './Providers'

const bebasNeue = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-events' })

export const metadata: Metadata = {
  title: 'Basketball E-commerce Social Platform',
  description: 'Basketball products platform integrating commerce, social and content',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" translate="no" className="notranslate">
      <body className={bebasNeue.variable}>
        <Providers>{children}</Providers>
        <div id="fly-to-cart-portal" suppressHydrationWarning />
      </body>
    </html>
  )
}
