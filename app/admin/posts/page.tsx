'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import AdminNav from '@/components/AdminNav'

interface Post {
  id: string
  title: string
  content: string
  status: string
  author: { username: string }
  category: { name: string } | null
  createdAt: string
}

export default function AdminPostsPage() {
  const router = useRouter()
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
      alert('You do not have permission to access this page')
      router.push('/dashboard')
      return
    }

    fetchPosts()
  }, [statusFilter, router])

  const fetchPosts = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`/api/admin/posts?status=${statusFilter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      } else {
        alert('Failed to fetch post list')
      }
    } catch (error) {
      console.error('Failed to fetch post list:', error)
      alert('获取帖子列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (postId: string, newStatus: 'APPROVED' | 'REJECTED') => {
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
        alert(newStatus === 'APPROVED' ? 'Post approved' : 'Post rejected')
        fetchPosts() // 刷新列表
      } else {
        const data = await response.json()
        alert(data.error || 'Operation failed')
      }
    } catch (error) {
      console.error('Review failed:', error)
      alert('Review failed, please try again')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'PENDING': { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
      'APPROVED': { text: 'Approved', color: 'bg-green-100 text-green-800' },
      'REJECTED': { text: 'Rejected', color: 'bg-red-100 text-red-800' }
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
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Post Review</span>
            </h1>
            <p className="text-xl text-gray-600">Manage pending, approved, and rejected posts</p>
          </div>

          {/* 状态筛选 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8 p-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">Filter Status: </span>
              {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    statusFilter === status
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'PENDING' ? 'Pending Review' : status === 'APPROVED' ? 'Approved' : 'Rejected'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
              <p className="text-gray-500 text-lg">No {statusFilter === 'PENDING' ? 'pending' : statusFilter === 'APPROVED' ? 'approved' : 'rejected'} posts</p>
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
                          <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full text-xs font-semibold">
                            {post.category.name}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h2>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span className="mr-4">Author: {post.author.username}</span>
                        <span>{new Date(post.createdAt).toLocaleString('en-US')}</span>
                      </div>
                      <div className="text-gray-700 leading-relaxed line-clamp-3 mb-4">
                        {post.content}
                      </div>
                      <Link
                        href={`/posts/${post.id}`}
                        className="text-orange-600 hover:text-orange-700 font-semibold text-sm"
                      >
                        View Full Content →
                      </Link>
                    </div>
                  </div>

                  {post.status === 'PENDING' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleReview(post.id, 'APPROVED')}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        ✅ Approve
                      </button>
                      <button
                        onClick={() => handleReview(post.id, 'REJECTED')}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  )}

                  {post.status === 'REJECTED' && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleReview(post.id, 'APPROVED')}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        ✅ Re-approve
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
