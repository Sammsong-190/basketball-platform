'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'

interface Product {
  id: string
  name: string
  price: number
  images: string
  category: { name: string }
  seller: { username: string }
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
    console.error('Product missing ID:', product)
    return null
  }

  const handleClick = (e: React.MouseEvent) => {
    console.log('Product card clicked, ID:', product.id)
    console.log('Product name:', product.name)
    // Let Link handle the navigation
  }

  return (
    <Link
      href={`/products/${product.id}`}
      className="block"
      prefetch={true}
      onClick={handleClick}
    >
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group cursor-pointer">
        <div className="h-64 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center relative overflow-hidden">
          {images[0] ? (
            <img
              src={images[0]}
              alt={product.name}
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
            <span className="text-sm text-gray-500 font-medium">Seller has not provided image</span>
          </div>
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
            {product.sourceType === 'PLATFORM_MANAGED' ? (
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                Platform Managed
              </span>
            ) : (
              <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                Free Trade
              </span>
            )}
          </div>
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-orange-600 pointer-events-none">
            {product.category.name}
          </div>
        </div>
        <div className="p-6">
          <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center mb-3">
            <div className="flex items-center">
              <span className="text-yellow-400">⭐</span>
              <span className="ml-1 text-sm font-semibold text-gray-700">
                {product.rating.toFixed(1)}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                ({product.reviewCount})
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-orange-600">
              ¥{product.price.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500">
              {product.seller.username}
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
  const [isSeller, setIsSeller] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')

  useEffect(() => {
    fetchProducts('')
    checkSellerStatus()
  }, [])

  // 300ms 防抖：输入时自动搜索（也支持回车/按钮）
  useEffect(() => {
    const t = setTimeout(() => {
      setAppliedKeyword(keyword.trim())
    }, 300)
    return () => clearTimeout(t)
  }, [keyword])

  useEffect(() => {
    fetchProducts(appliedKeyword)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKeyword])

  // 按 sourceType 分组
  const platformManagedProducts = products.filter(p => p.sourceType === 'PLATFORM_MANAGED')
  const freeTradeProducts = products.filter(p => p.sourceType !== 'PLATFORM_MANAGED')

  // 是否有搜索关键词
  const hasSearchKeyword = appliedKeyword.length > 0

  const checkSellerStatus = () => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      setIsSeller(user.isSeller === true)
    }
  }

  const fetchProducts = async (kw: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (kw) params.set('keyword', kw)
      const url = params.toString() ? `/api/products?${params.toString()}` : '/api/products'

      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        const productsList = (data.products || []).filter((p: Product) => {
          // Ensure product has valid ID
          if (!p.id || typeof p.id !== 'string') {
            console.warn('Invalid product found (missing ID):', p)
            return false
          }
          return true
        })
        console.log('Fetched products:', productsList.length, 'products')
        if (productsList.length > 0) {
          console.log('Sample product IDs:', productsList.slice(0, 3).map((p: Product) => p.id))
        }
        setProducts(productsList)
      } else {
        console.error('Failed to fetch products:', data.error)
        setProducts([])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold mb-4 text-gray-900 flex items-center">
                <span className="mr-3">🛒</span>
                <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Featured Products</span>
              </h1>
              <p className="text-xl text-gray-600">Discover the finest basketball products</p>
            </div>
            {isSeller && (
              <Link
                href="/products/new"
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
              >
                ➕ Add Product
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
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                    placeholder="Search by product name / seller name / category name..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setAppliedKeyword(keyword.trim())}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all font-semibold shadow-md hover:shadow-lg"
                  >
                    Search
                  </button>
                  <button
                    onClick={() => {
                      setKeyword('')
                      setAppliedKeyword('')
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Search by <span className="font-semibold text-gray-700">product name</span>, <span className="font-semibold text-gray-700">seller name</span>, or <span className="font-semibold text-gray-700">category name</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600 text-lg">
                {appliedKeyword ? `No products found for "${appliedKeyword}"` : 'No products available'}
              </p>
            </div>
          ) : hasSearchKeyword ? (
            // 搜索时：合并显示所有符合条件的商品
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                    <h2 className="text-3xl font-bold text-gray-900">Platform Managed</h2>
                    <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {platformManagedProducts.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {platformManagedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}

              {/* 自由交易 */}
              {freeTradeProducts.length > 0 && (
                <div>
                  <div className="flex items-center mb-6">
                    <div className="h-1 w-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full mr-4"></div>
                    <h2 className="text-3xl font-bold text-gray-900">Free Trade</h2>
                    <span className="ml-4 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      {freeTradeProducts.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {freeTradeProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
