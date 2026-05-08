'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import AdminNav from '@/components/AdminNav'
import { useToast } from '@/components/Toast'

interface Post {
  id: string
  title: string
  status: string
  author: { username: string }
  category: { name: string } | null
  createdAt: string
}

export default function AdminPostsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // 检查用户权限
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

    fetchPosts()
  }, [statusFilter, router])

  const fetchPosts = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true
    if (!silent) {
      setLoading(true)
    }
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`/api/admin/posts?status=${statusFilter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      } else {
        alert('获取帖子列表失败')
      }
    } catch (error) {
      console.error('获取帖子列表失败:', error)
      alert('加载帖子失败')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  const handleReview = async (postId: string, newStatus: 'APPROVED' | 'REJECTED' | 'DELETED') => {
    if (newStatus === 'DELETED' && !confirm('确定删除该帖子吗？此操作不可恢复。')) {
      return
    }

    const token = localStorage.getItem('token')
    try {
      const response = await fetch('/api/admin/posts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: postId, status: newStatus })
      })

      if (response.ok) {
        showToast(newStatus === 'APPROVED' ? '帖子已通过' : newStatus === 'REJECTED' ? '帖子已拒绝' : '帖子已删除')
        setPosts((prev) => prev.filter((p) => p.id !== postId))
      } else {
        const data = await response.json()
        alert(data.error || '操作失败')
      }
    } catch (error) {
      console.error('审核失败:', error)
      alert('审核失败，请重试')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'PENDING': { text: '待审核', color: 'bg-yellow-100 text-yellow-800' },
      'APPROVED': { text: '已通过', color: 'bg-green-100 text-green-800' },
      'REJECTED': { text: '已拒绝', color: 'bg-red-100 text-red-800' }
    }
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <>
      <Header />
      <AdminNav />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 text-gray-900 flex items-center">
              <span className="mr-3">📋</span>
              <span className="bg-gradient-to-r text-gray-900">帖子审核</span>
            </h1>
            <p className="text-xl text-gray-600">管理待审、已通过和已拒绝的帖子</p>
          </div>

          {/* 状态筛选 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8 p-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">筛选状态： </span>
              {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    statusFilter === status
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'PENDING' ? '待审核' : status === 'APPROVED' ? '已通过' : '已拒绝'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
              <p className="mt-4 text-gray-600">加载中…</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
              <p className="text-gray-500 text-lg">
                {statusFilter === 'PENDING'
                  ? '暂无待审核帖子'
                  : statusFilter === 'APPROVED'
                    ? '暂无已通过帖子'
                    : '暂无已拒绝帖子'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusBadge(post.status)}
                        {post.category && (
                          <span className="px-3 py-1 bg-gradient-to-r bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                            {post.category.name}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h2>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span className="mr-4">作者：{post.author.username}</span>
                        <span>{new Date(post.createdAt).toLocaleString('zh-CN')}</span>
                      </div>
                      <p className="text-gray-500 text-sm mb-4">
                        正文未在列表中加载以提升速度，请点此查看全文。
                      </p>
                      <Link
                        href={`/posts/${post.id}`}
                        className="text-gray-900 hover:text-gray-700 font-semibold text-sm"
                      >
                        查看全文 →
                      </Link>
                    </div>
                  </div>

                  {post.status === 'PENDING' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleReview(post.id, 'APPROVED')}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        ✅ 通过
                      </button>
                      <button
                        onClick={() => handleReview(post.id, 'REJECTED')}
                        className="flex-1 px-6 py-3 bg-gradient-to-r bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        ❌ 拒绝
                      </button>
                      <button
                        onClick={() => handleReview(post.id, 'DELETED')}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-semibold"
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  )}

                  {(post.status === 'APPROVED' || post.status === 'REJECTED') && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      {post.status === 'REJECTED' && (
                        <button
                          onClick={() => handleReview(post.id, 'APPROVED')}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                          ✅ 改为通过
                        </button>
                      )}
                      <button
                        onClick={() => handleReview(post.id, 'DELETED')}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-semibold"
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
