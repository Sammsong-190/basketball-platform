'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: '/admin',
      label: 'Admin Home',
      icon: '⚙️'
    },
    {
      href: '/admin/posts',
      label: 'Post Review',
      icon: '📋'
    },
    {
      href: '/admin/products',
      label: 'Product Review',
      icon: '🛒'
    },
    {
      href: '/admin/comments',
      label: 'Comment Review',
      icon: '💬'
    },
    {
      href: '/admin/scrape-products',
      label: 'Scrape Products',
      icon: '🕷️'
    }
  ]

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-16 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-6 py-4 font-semibold text-sm whitespace-nowrap transition-all relative ${
                  isActive
                    ? 'text-gray-900 bg-gray-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gray-600 to-gray-800"></div>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
