'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import AdminNav from '@/components/AdminNav'
import { useToast } from '@/components/Toast'

interface Comment {
  id: string
  content: string
  status: string
  author: { id: string; username: string }
  post?: { id: string; title: string }
  product?: { id: string; name: string }
  createdAt: string
}

export default function AdminCommentsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
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

    fetchComments()
  }, [statusFilter, router])

  const fetchComments = async () => {
    setComments([])
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`/api/admin/comments?status=${statusFilter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      } else {
        alert('获取评论失败')
      }
    } catch (error) {
      console.error('获取评论失败:', error)
      alert('获取评论失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (commentId: string, newStatus: 'APPROVED' | 'REJECTED') => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch('/api/admin/comments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: commentId, status: newStatus })
      })

      if (response.ok) {
        showToast(newStatus === 'APPROVED' ? '评论已通过' : '评论已拒绝')
        fetchComments()
      } else {
        const data = await response.json()
        alert(data.error || '操作失败')
      }
    } catch (error) {
      console.error('审核失败:', error)
      alert('审核失败，请重试')
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('确定删除该评论吗？')) {
      return
    }

    const token = localStorage.getItem('token')
    try {
      const response = await fetch('/api/admin/comments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: commentId, status: 'DELETED' })
      })

      if (response.ok) {
        showToast('评论已删除')
        fetchComments()
      } else {
        const data = await response.json()
        alert(data.error || '删除评论失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除评论失败，请重试')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
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
              <span className="mr-3">💬</span>
              <span className="bg-gradient-to-r text-gray-900">评论审核</span>
            </h1>
            <p className="text-xl text-gray-600">审核并管理帖子与商品下的评论</p>
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
          ) : comments.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
              <p className="text-gray-500 text-lg">
                {statusFilter === 'PENDING'
                  ? '暂无待审核评论'
                  : statusFilter === 'APPROVED'
                    ? '暂无已通过评论'
                    : '暂无已拒绝评论'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {getStatusBadge(comment.status)}
                        <span className="text-sm text-gray-500">
                          用户：{comment.author.username}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed mb-4">{comment.content}</p>
                      <div className="flex gap-4 text-sm">
                        {comment.post && (
                          <Link
                            href={`/posts/${comment.post.id}`}
                            className="text-gray-900 hover:text-gray-700 font-semibold"
                          >
                            📝 帖子：{comment.post.title}
                          </Link>
                        )}
                        {comment.product && (
                          <Link
                            href={`/products/${comment.product.id}`}
                            className="text-gray-900 hover:text-gray-700 font-semibold"
                          >
                            🛒 商品：{comment.product.name}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {comment.status === 'PENDING' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleReview(comment.id, 'APPROVED')}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        ✅ 通过
                      </button>
                      <button
                        onClick={() => handleReview(comment.id, 'REJECTED')}
                        className="flex-1 px-6 py-3 bg-gradient-to-r bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                      >
                        ❌ 拒绝
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-semibold"
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  )}

                  {(comment.status === 'APPROVED' || comment.status === 'REJECTED') && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      {comment.status === 'REJECTED' && (
                        <button
                          onClick={() => handleReview(comment.id, 'APPROVED')}
                          className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                          ✅ 改为通过
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(comment.id)}
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
