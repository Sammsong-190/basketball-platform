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
      alert('无权访问此页面')
      router.push('/dashboard')
      return
    }
  }, [router])

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  const adminMenus = [
    {
      title: '帖子审核',
      description: '审核待处理、已通过与被拒绝的帖子',
      href: '/admin/posts',
      icon: '📋',
      color: 'from-gray-500 to-gray-700'
    },
    {
      title: '评论管理',
      description: '审核与管理帖子、商品下的用户评论',
      href: '/admin/comments',
      icon: '💬',
      color: 'from-gray-500 to-gray-700'
    },
    {
      title: '商品审核',
      description: '审核与管理平台商品，通过或下架商品',
      href: '/admin/products',
      icon: '🛒',
      color: 'from-gray-600 to-gray-800'
    },
    {
      title: '商品数据采集',
      description: '从常见电商数据源抓取篮球相关商品（仅供运营使用）',
      href: '/admin/scrape-products',
      icon: '🕷️',
      color: 'from-gray-700 to-gray-900'
    },
    {
      title: '退款处理',
      description: '处理用户的退款与退货申请',
      href: '/admin/refunds',
      icon: '↩️',
      color: 'from-orange-500 to-orange-700'
    },
    {
      title: '投诉与建议',
      description: '查看并回复用户投诉与建议',
      href: '/admin/complaints',
      icon: '📢',
      color: 'from-blue-500 to-blue-700'
    },
    {
      title: '用户管理',
      description: '管理用户角色与卖家权限',
      href: '/admin/users',
      icon: '👥',
      color: 'from-green-500 to-green-700'
    },
    {
      title: '系统日志',
      description: '查看系统运行与运维相关日志',
      href: '/admin/logs',
      icon: '📋',
      color: 'from-gray-600 to-gray-800'
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
              <span className="text-gray-900">管理后台</span>
            </h1>
            <p className="text-xl text-gray-600">平台运营与审核功能入口</p>
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
