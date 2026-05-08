'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

interface Product {
  id: string
  name: string
  price: number
  images: string
  category?: { name: string } | null
  seller?: { username: string } | null
  rating: number
  reviewCount: number
  sourceType?: string
}

// 安全解析图片 JSON
function safeParseImages(raw: string | null | undefined) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// 商品卡片组件
function ProductCard({ product }: { product: Product }) {
  const images = safeParseImages(product.images)

  if (!product.id) {
    return null
  }

  return (
    <Link
      href={`/products/${product.id}`}
      className="block h-full"
      prefetch={false}
    >
      <div className="h-full flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group cursor-pointer">
        <div className="h-64 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
          {images[0] ? (
            <img
              src={images[0]}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const placeholder = target.parentElement?.querySelector('.no-image-placeholder')
                if (placeholder) {
                  (placeholder as HTMLElement).style.display = 'flex'
                }
              }}
            />
          ) : null}
          <div className="no-image-placeholder absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none" style={{ display: images[0] ? 'none' : 'flex' }}>
            <span className="text-5xl mb-2">🏀</span>
            <span className="text-sm text-gray-500 font-medium">卖家未上传图片</span>
          </div>
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
            {product.sourceType === 'PLATFORM_MANAGED' ? (
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                平台自营
              </span>
            ) : (
              <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                自由交易
              </span>
            )}
          </div>
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs font-medium text-gray-900 pointer-events-none">
            {product.category?.name ?? '未分类'}
          </div>
        </div>
        <div className="flex-1 flex flex-col p-6 min-h-[140px]">
          <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 group-hover:text-gray-900 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              <span className="text-yellow-400">⭐</span>
              <span className="ml-1 text-sm font-semibold text-gray-700">
                {(Number(product.rating) || 0).toFixed(1)}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                ({Number(product.reviewCount) || 0})
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-2xl font-bold text-gray-900">
              ¥{(Number(product.price) || 0).toFixed(2)}
            </span>
            <span className="text-sm text-gray-500 truncate max-w-[120px]">
              {product.seller?.username ?? '—'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [listRetryKey, setListRetryKey] = useState(0)
  const [isSeller, setIsSeller] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [platformExpanded, setPlatformExpanded] = useState(false)
  const [freeTradeExpanded, setFreeTradeExpanded] = useState(false)

  const DISPLAY_LIMIT = 8

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setIsSeller(user.isSeller === true)
      } catch {
        setIsSeller(false)
      }
    }
  }, [])

  // 300ms 防抖：输入时自动搜索（也支持回车/按钮）
  useEffect(() => {
    const t = setTimeout(() => {
      setAppliedKeyword(keyword.trim())
    }, 300)
    return () => clearTimeout(t)
  }, [keyword])

  useEffect(() => {
    const ac = new AbortController()

    const load = async (attempt: number) => {
      setLoading(true)
      setListError(null)
      const params = new URLSearchParams()
      params.set('limit', '48')
      if (appliedKeyword) params.set('keyword', appliedKeyword)
      const url = `/api/products?${params.toString()}`

      const doFetch = async () => {
        const response = await fetch(url, {
          signal: ac.signal,
          cache: 'no-store',
        })
        const text = await response.text()
        let data: { products?: Product[]; error?: string } = {}
        if (text) {
          try {
            data = JSON.parse(text) as typeof data
          } catch {
            throw new Error('服务器返回数据格式异常')
          }
        }
        if (!response.ok) {
          throw new Error(data.error || `加载失败（${response.status}）`)
        }
        return data
      }

      try {
        let data: { products?: Product[]; error?: string }
        try {
          data = await doFetch()
        } catch (e) {
          if (
            attempt === 0 &&
            !(e instanceof DOMException && e.name === 'AbortError')
          ) {
            await new Promise((r) => setTimeout(r, 450))
            if (ac.signal.aborted) return
            data = await doFetch()
          } else {
            throw e
          }
        }

        if (ac.signal.aborted) return

        const productsList = (data.products || []).filter((p: Product) => {
          if (!p.id || typeof p.id !== 'string') return false
          return true
        })
        setProducts(productsList)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setProducts([])
        setListError(
          err instanceof Error ? err.message : '加载商品列表失败，请检查网络后重试'
        )
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    }

    void load(0)
    return () => ac.abort()
  }, [appliedKeyword, listRetryKey])

  // 按 sourceType 分组
  const platformManagedProducts = products.filter(p => p.sourceType === 'PLATFORM_MANAGED')
  const freeTradeProducts = products.filter(p => p.sourceType !== 'PLATFORM_MANAGED')

  // 是否有搜索关键词
  const hasSearchKeyword = appliedKeyword.length > 0

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold mb-4 text-gray-900 flex items-center">
                <span className="mr-3">🛒</span>
                <span className="text-gray-900">精选好物</span>
              </h1>
              <p className="text-xl text-gray-600">发现心仪的篮球装备与周边</p>
            </div>
            {isSeller && (
              <Link
                href="/products/new"
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
              >
                ➕ 上架商品
              </Link>
            )}
          </div>

          {/* 搜索栏 */}
          <div className="mb-8">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-5">
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <div className="relative flex-1">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setAppliedKeyword(keyword.trim())
                    }}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none"
                    placeholder="搜索商品名、卖家名或分类…"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAppliedKeyword(keyword.trim())}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-semibold shadow-md hover:shadow-lg"
                  >
                    搜索
                  </button>
                  <button
                    onClick={() => {
                      setKeyword('')
                      setAppliedKeyword('')
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                  >
                    清空
                  </button>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                支持按 <span className="font-semibold text-gray-700">商品名称</span>、
                <span className="font-semibold text-gray-700">卖家名称</span> 或{' '}
                <span className="font-semibold text-gray-700">分类名称</span> 搜索
              </div>
            </div>
          </div>

          {listError && (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-amber-900">{listError}</p>
              <button
                type="button"
                onClick={() => setListRetryKey((k) => k + 1)}
                className="shrink-0 px-4 py-2 bg-amber-800 text-white rounded-lg text-sm font-semibold hover:bg-amber-900"
              >
                重新加载
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
              <p className="mt-4 text-gray-600">加载中…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">
                {listError
                  ? '商品列表未能加载，请点击上方「重新加载」。'
                  : appliedKeyword
                    ? `未找到与「${appliedKeyword}」相关的商品`
                    : '暂无商品'}
              </p>
            </div>
          ) : hasSearchKeyword ? (
            // 搜索时：合并显示所有符合条件的商品
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            // 默认：分开显示平台自营和自由交易
            <div className="space-y-12">
              {/* 平台自营 */}
              {platformManagedProducts.length > 0 && (
                <div>
                  <div className="flex items-center mb-6">
                    <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mr-4"></div>
                    <h2 className="text-3xl font-bold text-gray-900">平台自营</h2>
                    <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {platformManagedProducts.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                    {(platformExpanded ? platformManagedProducts : platformManagedProducts.slice(0, DISPLAY_LIMIT)).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  {platformManagedProducts.length > DISPLAY_LIMIT && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => setPlatformExpanded(!platformExpanded)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-md"
                      >
                        {platformExpanded ? '收起' : `展开（还有 ${platformManagedProducts.length - DISPLAY_LIMIT} 件）`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 自由交易 */}
              {freeTradeProducts.length > 0 && (
                <div>
                  <div className="flex items-center mb-6">
                    <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full mr-4"></div>
                    <h2 className="text-3xl font-bold text-gray-900">自由交易</h2>
                    <span className="ml-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      {freeTradeProducts.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch">
                    {(freeTradeExpanded ? freeTradeProducts : freeTradeProducts.slice(0, DISPLAY_LIMIT)).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  {freeTradeProducts.length > DISPLAY_LIMIT && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => setFreeTradeExpanded(!freeTradeExpanded)}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-semibold shadow-md"
                      >
                        {freeTradeExpanded ? '收起' : `展开（还有 ${freeTradeProducts.length - DISPLAY_LIMIT} 件）`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
