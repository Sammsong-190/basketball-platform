'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export type FavoriteTargetType = 'POST' | 'COMMENT'

type FavoriteStarProps = {
  type: FavoriteTargetType
  targetId: string
  className?: string
  label?: string
}

export default function FavoriteStar({ type, targetId, className = '', label }: FavoriteStarProps) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!targetId) return
    const token = localStorage.getItem('token')
    if (!token) {
      setFavorited(false)
      return
    }
    try {
      const res = await fetch(
        `/api/users/favorites?check=1&type=${encodeURIComponent(type)}&targetId=${encodeURIComponent(targetId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.ok) {
        const data = await res.json()
        setFavorited(!!data.favorited)
      }
    } catch {
      /* ignore */
    }
  }, [type, targetId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录')
      router.push('/login')
      return
    }
    setLoading(true)
    try {
      if (favorited) {
        const res = await fetch(
          `/api/users/favorites?type=${encodeURIComponent(type)}&targetId=${encodeURIComponent(targetId)}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
        )
        if (res.ok) setFavorited(false)
        else {
          const d = await res.json().catch(() => ({}))
          alert(d.error || '取消收藏失败')
        }
      } else {
        const res = await fetch('/api/users/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ type, targetId }),
        })
        if (res.ok) setFavorited(true)
        else {
          const d = await res.json().catch(() => ({}))
          alert(d.error || '收藏失败')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || !targetId}
      title={favorited ? '取消收藏' : '收藏'}
      className={`inline-flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 ${className}`}
    >
      <span className="text-lg leading-none" aria-hidden>
        {favorited ? '★' : '☆'}
      </span>
      {label ? <span className="text-sm">{favorited ? '已收藏' : '收藏'}</span> : null}
    </button>
  )
}
