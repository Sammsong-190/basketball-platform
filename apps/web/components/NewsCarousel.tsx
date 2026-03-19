'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface NewsItem {
  id: string
  title: string
  content: string
  image?: string
  publishedAt: string
  author: string
  url?: string
}

export default function NewsCarousel() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    fetchNews()
  }, [])

  useEffect(() => {
    if (news.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [news.length])

  const fetchNews = async () => {
    try {
      // 优先从 NBA API 获取新闻
      const nbaResponse = await fetch('/api/nba/scrape?type=news', {
        cache: 'no-store',
        next: { revalidate: 300 } // 5分钟缓存
      })

      if (nbaResponse.ok) {
        const nbaData = await nbaResponse.json()
        if (nbaData.news && nbaData.news.length > 0) {
          // 取前5条
          setNews(nbaData.news.slice(0, 5))
          setLoading(false)
          return
        }
      }

      // 如果 NBA API 失败，从数据库获取
      const response = await fetch('/api/posts?isNews=true&limit=5')
      const data = await response.json()
      const newsData = (data.posts || []).map((post: any) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        image: post.images ? JSON.parse(post.images)[0] : null,
        publishedAt: post.createdAt,
        author: post.author?.username || 'Unknown',
        url: null
      }))
      setNews(newsData)
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-96 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
      </div>
    )
  }

  if (news.length === 0) {
    return (
      <div className="h-96 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
        <p className="text-gray-600">No event news available</p>
      </div>
    )
  }

  const currentNews = news[currentIndex]
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div
      className="relative h-96 bg-gradient-to-r from-gray-100 via-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image (if available) */}
      {currentNews.image && (
        <div className="absolute inset-0">
          <img
            src={currentNews.image}
            alt={currentNews.title}
            className="w-full h-full object-cover opacity-20"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-400/25 via-gray-300/25 to-gray-400/25"></div>
        </div>
      )}

      {/* Background Pattern (if no image) */}
      {!currentNews.image && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #ea580c 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
      )}

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center p-8 md:p-12">
        <div className="flex items-center space-x-2 mb-4">
          <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-sm font-semibold">
            🏀 NBA Events
          </span>
          <span className="text-gray-900 text-sm">
            {formatDate(currentNews.publishedAt)}
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 line-clamp-2">
          {currentNews.title}
        </h2>

        <p className="text-gray-700 text-lg mb-6 line-clamp-3">
          {currentNews.content.substring(0, 150)}...
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-gray-700">
            <span>👤 {currentNews.author}</span>
          </div>
          {currentNews.url ? (
            <a
              href={currentNews.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Read More →
            </a>
          ) : (
            <Link
              href={`/events?tab=news`}
              className="px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              View Details →
            </Link>
          )}
        </div>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
        {news.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${index === currentIndex
              ? 'w-8 bg-gray-600 shadow-lg'
              : 'w-2 bg-gray-400 hover:bg-gray-500'
              }`}
            aria-label={`Switch to news ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      {news.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + news.length) % news.length)}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/95 rounded-full hover:bg-white transition-all shadow-xl z-10 backdrop-blur-sm border border-gray-200 ${isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            aria-label="Previous news"
          >
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % news.length)}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-white/95 rounded-full hover:bg-white transition-all shadow-xl z-10 backdrop-blur-sm border border-gray-200 ${isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            aria-label="Next news"
          >
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
