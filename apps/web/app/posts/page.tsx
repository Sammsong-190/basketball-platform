'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/Header'

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
  _count: { comments: number }
  isNews?: boolean
}

function PostsContent() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const isNews = searchParams.get('isNews') === 'true'
  const isHot = searchParams.get('isHot') === 'true'

  useEffect(() => {
    fetchPosts(isNews, isHot)
  }, [isNews, isHot])

  const fetchPosts = async (news?: boolean, hot?: boolean) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (news) params.set('isNews', 'true')
      if (hot) params.set('sortByHot', 'true')
      const url = params.toString() ? `/api/posts?${params}` : '/api/posts'
      const response = await fetch(url)
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-5xl font-bold mb-4 text-gray-900 flex items-center">
                <span className="mr-3">{isNews ? '📰' : isHot ? '🔥' : '💬'}</span>
                <span className="text-gray-900">
                  {isNews ? 'Event News' : isHot ? 'Trending' : 'Community'}
                </span>
              </h1>
              <p className="text-xl text-gray-600">
                {isNews ? 'Latest basketball event news and score analysis' : isHot ? 'Most liked and popular community content' : 'Share and interact with basketball enthusiasts'}
              </p>
            </div>
            {!isNews && (
              <Link 
                href="/posts/new" 
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                ✏️ New Post
              </Link>
            )}
          </div>

          {!isNews && (
            <div className="flex gap-2 mb-8">
              <Link
                href="/posts"
                className={`px-4 py-2 rounded-lg font-medium ${!isHot ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All
              </Link>
              <Link
                href="/posts?isHot=true"
                className={`px-4 py-2 rounded-lg font-medium ${isHot ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                🔥 Trending
              </Link>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">No posts available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => {
                let firstImage: string | null = null
                if (post.images) {
                  try {
                    const parsed = JSON.parse(post.images)
                    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                      firstImage = parsed[0]
                    } else if (typeof parsed === 'string' && parsed.startsWith('data:')) {
                      firstImage = parsed
                    }
                  } catch (_) {}
                }
                return (
                <Link key={post.id} href={`/posts/${post.id}`}>
                  <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 group">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900 group-hover:text-gray-600 transition-colors line-clamp-2 flex-1">
                        {post.title}
                      </h2>
                      {post.category && (
                        <span className="ml-4 px-4 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold whitespace-nowrap">
                          {post.category.name}
                        </span>
                      )}
                      {post.isNews && (
                        <span className="ml-2 px-3 py-1 bg-gray-700 text-white rounded-full text-xs font-semibold">
                          📰 News
                        </span>
                      )}
                      {(post as any).isHot && (
                        <span className="ml-2 px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-semibold">
                          🔥 Hot
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                      {post.content}
                    </p>
                    {firstImage && (
                      <div className="mb-4 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 inline-block">
                        <img src={firstImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <span className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-semibold">
                            {post.author.username.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-medium">{post.author.username}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            👁️ <span className="ml-1">{post.views}</span>
                          </span>
                          <span className="flex items-center">
                            ❤️ <span className="ml-1">{post.likes}</span>
                          </span>
                          <span className="flex items-center">
                            💬 <span className="ml-1">{post._count.comments}</span>
                          </span>
                        </div>
                      </div>
                      <span className="text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              )})}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function PostsPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </>
    }>
      <PostsContent />
    </Suspense>
  )
}
