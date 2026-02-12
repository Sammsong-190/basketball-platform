'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

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
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null) // 正在回复的评论ID
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({}) // 每个评论的回复内容
  const [submittingReply, setSubmittingReply] = useState<{ [key: string]: boolean }>({}) // 每个评论的提交状态
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
      console.error('Failed to fetch post:', error)
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
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
      }
    } catch (error) {
      console.error('Failed to check like status:', error)
    }
  }

  const handleLike = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('Please login first')
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`/api/posts/${params.id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data.liked)
        // 更新点赞数
        if (post) {
          setPost({
            ...post,
            likes: data.liked ? post.likes + 1 : post.likes - 1
          })
        }
      } else {
        alert('Failed to like')
      }
    } catch (error) {
      console.error('Failed to like:', error)
      alert('Failed to like, please try again')
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) {
      alert('Please login first')
      router.push('/login')
      return
    }

    if (!commentContent.trim()) {
      alert('Please enter comment content')
      return
    }

    setSubmittingComment(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: commentContent,
          postId: params.id
        })
      })

      if (response.ok) {
        setCommentContent('')
        // 管理员发布的评论立即显示，普通用户需要审核
        const userRole = user?.role
        if (userRole === 'ADMIN') {
          alert('Comment posted successfully!')
        } else {
          alert('Comment submitted, awaiting review')
        }
        fetchPost(params.id as string) // 刷新帖子数据
        // 保持评论输入框显示，方便继续评论
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to comment')
      }
    } catch (error) {
      console.error('Failed to comment:', error)
      alert('Failed to comment, please try again')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleReplySubmit = async (commentId: string) => {
    const token = localStorage.getItem('token')
    if (!token) {
      alert('Please login first')
      router.push('/login')
      return
    }

    const content = replyContent[commentId]?.trim()
    if (!content) {
      alert('Please enter reply content')
      return
    }

    setSubmittingReply({ ...submittingReply, [commentId]: true })
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: content,
          postId: params.id,
          parentId: commentId
        })
      })

      if (response.ok) {
        setReplyContent({ ...replyContent, [commentId]: '' })
        setReplyingTo(null)
        // 管理员发布的回复立即显示，普通用户需要审核
        const userRole = user?.role
        if (userRole === 'ADMIN') {
          alert('Reply posted successfully!')
        } else {
          alert('Reply submitted, awaiting review')
        }
        fetchPost(params.id as string) // 刷新帖子数据
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to reply')
      }
    } catch (error) {
      console.error('Failed to reply:', error)
      alert('Failed to reply, please try again')
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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
            <Link href="/posts" className="text-orange-600 hover:underline">
              Back to Posts
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
          <Link href="/posts" className="text-orange-600 hover:underline mb-6 inline-block">
            ← Back to Posts
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              {post.category && (
                <span className="inline-block px-4 py-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full text-sm font-semibold mb-4">
                  {post.category.name}
                </span>
              )}
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
              <div className="flex items-center text-gray-600 text-sm">
                <span className="mr-4">Author: {post.author.username}</span>
                <span className="mr-4">Views: {post.views}</span>
                <span className="mr-4">Likes: {post.likes}</span>
                <span className="mr-4">Comments: {post._count?.comments || 0}</span>
                <span>{new Date(post.createdAt).toLocaleString('en-US')}</span>
              </div>
            </div>

            <div className="prose max-w-none mb-8">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {post.content}
              </div>
              {post.images && (() => {
                try {
                  const imgArr = JSON.parse(post.images) as string[]
                  if (Array.isArray(imgArr) && imgArr.length > 0) {
                    return (
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {imgArr.map((src, i) => (
                          <img
                            key={i}
                            src={src}
                            alt={`Post image ${i + 1}`}
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

            {/* 点赞和评论按钮 */}
            <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  isLiked
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">{isLiked ? '❤️' : '🤍'}</span>
                <span>Like</span>
                <span className="ml-1">({post.likes})</span>
              </button>
              
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200"
              >
                <span className="text-xl">💬</span>
                <span>Comment</span>
                <span className="ml-1">({post._count?.comments || post.comments?.length || 0})</span>
              </button>
            </div>
          </div>

          {/* 评论区域 - 始终显示评论列表 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Comments ({post._count?.comments || post.comments?.length || 0})
            </h2>

            {/* 评论输入框 - 点击按钮后显示 */}
            {showCommentForm && (
              <div className="mb-8">
                {user ? (
                  <form onSubmit={handleCommentSubmit}>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <textarea
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Write your comment..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingComment || !commentContent.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed self-end"
                    >
                      {submittingComment ? 'Submitting...' : 'Post Comment'}
                    </button>
                  </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Comments need administrator review before being displayed
                    </p>
                  </form>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600 mb-3">Please login first to post comments</p>
                    <Link
                      href="/login"
                      className="text-orange-600 hover:text-orange-700 font-semibold"
                    >
                      Login Now →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* 评论列表 - 始终显示 */}
            {post.comments && post.comments.length > 0 ? (
                <div className="space-y-6">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
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
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-semibold text-gray-900">{comment.author.username}</span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString('en-US')}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                          
                          {/* 回复按钮 */}
                          <div className="mt-3">
                            <button
                              onClick={() => {
                                if (!user) {
                                  alert('Please login first')
                                  router.push('/login')
                                  return
                                }
                                setReplyingTo(replyingTo === comment.id ? null : comment.id)
                              }}
                              className="text-sm text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                            >
                              {replyingTo === comment.id ? 'Cancel Reply' : 'Reply'}
                            </button>
                          </div>

                          {/* 回复输入框 */}
                          {replyingTo === comment.id && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <textarea
                                value={replyContent[comment.id] || ''}
                                onChange={(e) => setReplyContent({ ...replyContent, [comment.id]: e.target.value })}
                                placeholder="Write your reply..."
                                rows={2}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none resize-none mb-3"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyContent({ ...replyContent, [comment.id]: '' })
                                  }}
                                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-all font-semibold"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleReplySubmit(comment.id)}
                                  disabled={submittingReply[comment.id] || !replyContent[comment.id]?.trim()}
                                  className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {submittingReply[comment.id] ? 'Submitting...' : 'Post Reply'}
                                </button>
                              </div>
                              <p className="mt-2 text-xs text-gray-500">
                                Replies need administrator review before being displayed
                              </p>
                            </div>
                          )}
                          
                          {/* 回复列表 */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-4 ml-4 pl-4 border-l-2 border-gray-200 space-y-4">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
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
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-sm text-gray-900">{reply.author.username}</span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(reply.createdAt).toLocaleString('en-US')}
                                      </span>
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
                <p>No comments yet, be the first to comment!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
