'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import AdminNav from '@/components/AdminNav'

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const userObj = JSON.parse(userData)
    setUser(userObj)
    
    if (userObj.role !== 'ADMIN') {
      alert('You do not have permission to access this page')
      router.push('/dashboard')
      return
    }
  }, [router])

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  const adminMenus = [
    {
      title: 'Post Review',
      description: 'Review pending, approved, and rejected posts',
      href: '/admin/posts',
      icon: '📋',
      color: 'from-gray-500 to-gray-700'
    },
    {
      title: 'Comment Review',
      description: 'Review and manage comments on posts and products',
      href: '/admin/comments',
      icon: '💬',
      color: 'from-gray-500 to-gray-700'
    },
    {
      title: 'Product Review',
      description: 'Review and manage platform products, approve or withdraw products',
      href: '/admin/products',
      icon: '🛒',
      color: 'from-gray-600 to-gray-800'
    },
    {
      title: 'Product Scraping',
      description: 'Scrape basketball products from well-known e-commerce websites',
      href: '/admin/scrape-products',
      icon: '🕷️',
      color: 'from-gray-700 to-gray-900'
    }
  ]

  return (
    <>
      <Header />
      <AdminNav />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 text-gray-900 flex items-center">
              <span className="mr-3">⚙️</span>
              <span className="text-gray-900">Admin Dashboard</span>
            </h1>
            <p className="text-xl text-gray-600">Platform management and review functions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adminMenus.map((menu) => (
              <Link
                key={menu.href}
                href={menu.href}
                className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group"
              >
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${menu.color} rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
                    {menu.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-gray-600 transition-colors">
                      {menu.title}
                    </h2>
                    <p className="text-gray-600">{menu.description}</p>
                  </div>
                  <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
