'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { useToast } from '@/components/Toast'
import FavoriteStar from '@/components/FavoriteStar'

interface Comment {
  id: string
  content: string
  author: { id: string; username: string; avatar: string | null }
  createdAt: string
  replies?: Comment[]
}

interface Post {
  id: string
  title: string
  content: string
  images?: string | null
  author: { username: string; avatar: string | null }
  category: { name: string } | null
  views: number
  likes: number
  createdAt: string
  comments?: Comment[]
  _count?: { comments: number }
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({})
  const [submittingReply, setSubmittingReply] = useState<{ [key: string]: boolean }>({})
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (params.id) {
      fetchPost(params.id as string)
      checkLikeStatus(params.id as string)
    }
  }, [params.id])

  const fetchPost = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/${id}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
      } else {
        router.push('/posts')
      }
    } catch (error) {
      console.error('获取帖子失败:', error)
      router.push('/posts')
    } finally {
      setLoading(false)
    }
  }

  const checkLikeStatus = async (postId: string) => {
    const token = localStorage.getItem('token')
    if (!token) {
      setIsLiked(false)
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}/check-like`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
      }
    } catch (error) {
      console.error('检查点赞状态失败:', error)
    }
  }

  const handleLike = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录')
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`/api/posts/${params.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        if (post) {
          setPost({
            ...post,
            likes: data.liked ? post.likes + 1 : post.likes - 1,
          })
        }
      } else {
        alert('点赞失败')
      }
    } catch (error) {
      console.error('点赞失败:', error)
      alert('点赞失败，请重试')
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录')
      router.push('/login')
      return
    }

    if (!commentContent.trim()) {
      alert('请输入评论内容')
      return
    }

    setSubmittingComment(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: commentContent,
          postId: params.id,
        }),
      })

      if (response.ok) {
        setCommentContent('')
        const userRole = user?.role
        if (userRole === 'ADMIN') {
          showToast('评论已发布')
        } else {
          showToast('评论已提交，待审核')
        }
        fetchPost(params.id as string)
      } else {
        const data = await response.json()
        alert(data.error || '评论失败')
      }
    } catch (error) {
      console.error('评论失败:', error)
      alert('评论失败，请重试')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleReplySubmit = async (commentId: string) => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录')
      router.push('/login')
      return
    }

    const content = replyContent[commentId]?.trim()
    if (!content) {
      alert('请输入回复内容')
      return
    }

    setSubmittingReply({ ...submittingReply, [commentId]: true })
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content,
          postId: params.id,
          parentId: commentId,
        }),
      })

      if (response.ok) {
        setReplyContent({ ...replyContent, [commentId]: '' })
        setReplyingTo(null)
        const userRole = user?.role
        if (userRole === 'ADMIN') {
          showToast('回复已发布')
        } else {
          showToast('回复已提交，待审核')
        }
        fetchPost(params.id as string)
      } else {
        const data = await response.json()
        alert(data.error || '回复失败')
      }
    } catch (error) {
      console.error('回复失败:', error)
      alert('回复失败，请重试')
    } finally {
      setSubmittingReply({ ...submittingReply, [commentId]: false })
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
            <p className="mt-4 text-gray-600">加载中…</p>
          </div>
        </div>
      </>
    )
  }

  if (!post) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">未找到帖子</h1>
            <Link href="/posts" className="text-gray-900 hover:underline">
              返回帖子列表
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Link href="/posts" className="text-gray-900 hover:underline mb-6 inline-block">
            ← 返回帖子列表
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              {post.category && (
                <span className="inline-block px-4 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold mb-4">
                  {post.category.name}
                </span>
              )}
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
              <div className="flex items-center text-gray-600 text-sm flex-wrap gap-x-4 gap-y-1">
                <span>作者：{post.author.username}</span>
                <span>浏览：{post.views}</span>
                <span>点赞：{post.likes}</span>
                <span>评论：{post._count?.comments || 0}</span>
                <span>{new Date(post.createdAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>

            <div className="prose max-w-none mb-8">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{post.content}</div>
              {post.images &&
                (() => {
                  try {
                    const imgArr = JSON.parse(post.images) as string[]
                    if (Array.isArray(imgArr) && imgArr.length > 0) {
                      return (
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {imgArr.map((src, i) => (
                            <img
                              key={i}
                              src={src}
                              alt={`帖子配图 ${i + 1}`}
                              className="w-full h-48 object-cover rounded-lg border border-gray-200"
                            />
                          ))}
                        </div>
                      )
                    }
                  } catch (_) {}
                  return null
                })()}
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  isLiked ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">{isLiked ? '❤️' : '🤍'}</span>
                <span>点赞</span>
                <span className="ml-1">({post.likes})</span>
              </button>

              <FavoriteStar type="POST" targetId={post.id} label className="px-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200" />

              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                <span className="text-xl">💬</span>
                <span>评论</span>
                <span className="ml-1">({post._count?.comments || post.comments?.length || 0})</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              评论区（{post._count?.comments || post.comments?.length || 0}）
            </h2>

            {showCommentForm && (
              <div className="mb-8">
                {user ? (
                  <form onSubmit={handleCommentSubmit}>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <textarea
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          placeholder="写下您的评论…"
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingComment || !commentContent.trim()}
                        className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed self-end"
                      >
                        {submittingComment ? '提交中…' : '发表评论'}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">评论需管理员审核后公开展示</p>
                  </form>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600 mb-3">请先登录后再发表评论</p>
                    <Link href="/login" className="text-gray-900 hover:text-gray-700 font-semibold">
                      立即登录 →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {post.comments && post.comments.length > 0 ? (
              <div className="space-y-6">
                {post.comments.map((comment) => (
                  <div
                    key={comment.id}
                    id={`comment-${comment.id}`}
                    className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0 scroll-mt-24"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {comment.author.avatar ? (
                          <img
                            src={comment.author.avatar}
                            alt={comment.author.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>{comment.author.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{comment.author.username}</span>
                          <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString('zh-CN')}</span>
                          <FavoriteStar type="COMMENT" targetId={comment.id} label className="ml-auto text-sm" />
                        </div>
                        <p className="text-gray-700 leading-relaxed">{comment.content}</p>

                        <div className="mt-3">
                          <button
                            onClick={() => {
                              if (!user) {
                                alert('请先登录')
                                router.push('/login')
                                return
                              }
                              setReplyingTo(replyingTo === comment.id ? null : comment.id)
                            }}
                            className="text-sm text-gray-900 hover:text-gray-700 font-semibold transition-colors"
                          >
                            {replyingTo === comment.id ? '取消回复' : '回复'}
                          </button>
                        </div>

                        {replyingTo === comment.id && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <textarea
                              value={replyContent[comment.id] || ''}
                              onChange={(e) => setReplyContent({ ...replyContent, [comment.id]: e.target.value })}
                              placeholder="写下您的回复…"
                              rows={2}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none resize-none mb-3"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingTo(null)
                                  setReplyContent({ ...replyContent, [comment.id]: '' })
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all font-semibold"
                              >
                                取消
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReplySubmit(comment.id)}
                                disabled={submittingReply[comment.id] || !replyContent[comment.id]?.trim()}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {submittingReply[comment.id] ? '提交中…' : '发表回复'}
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">回复需管理员审核后公开展示</p>
                          </div>
                        )}

                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-200 space-y-4">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} id={`comment-${reply.id}`} className="flex items-start gap-3 scroll-mt-24">
                                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                  {reply.author.avatar ? (
                                    <img
                                      src={reply.author.avatar}
                                      alt={reply.author.username}
                                      className="w-full h-full rounded-full object-cover"
                                    />
                                  ) : (
                                    <span>{reply.author.username.charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-semibold text-sm text-gray-900">{reply.author.username}</span>
                                    <span className="text-xs text-gray-500">{new Date(reply.createdAt).toLocaleString('zh-CN')}</span>
                                    <FavoriteStar type="COMMENT" targetId={reply.id} label className="ml-auto text-xs" />
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>还没有评论，快来抢沙发！</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
