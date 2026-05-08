'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { useToast } from '@/components/Toast'
import CheckoutDrawer from '@/components/CheckoutDrawer'
import FlyToCart from '@/components/FlyToCart'

function parseProductImages(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const x = JSON.parse(raw)
    return Array.isArray(x) ? x : []
  } catch {
    return []
  }
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  images: string
  category: { name: string }
  seller: { id: string; username: string; avatar: string | null }
  rating: number
  reviewCount: number
  sourceType?: string
  status?: string
  _count: { reviews: number; orderItems: number }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [detailRetryKey, setDetailRetryKey] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [flyToCart, setFlyToCart] = useState<{ imageSrc: string; fromRect: DOMRect } | null>(null)
  const productImageRef = useRef<HTMLDivElement>(null)

  const productId = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (!productId) {
      setLoading(false)
      setLoadError(null)
      router.push('/products')
      return
    }

    const ac = new AbortController()

    const run = async () => {
      setLoading(true)
      setLoadError(null)

      const fetchOnce = async () => {
        const response = await fetch(`/api/products/${productId}`, {
          signal: ac.signal,
          cache: 'no-store',
        })
        const text = await response.text()
        if (response.status === 404) {
          return { kind: 'not_found' as const }
        }
        let data: Product | { error?: string } | null = null
        if (text) {
          try {
            data = JSON.parse(text) as Product | { error?: string }
          } catch {
            return {
              kind: 'error' as const,
              message: '服务器返回数据异常',
            }
          }
        }
        if (!response.ok) {
          const msg =
            data && typeof data === 'object' && 'error' in data && data.error
              ? String(data.error)
              : `加载失败（${response.status}）`
          return { kind: 'error' as const, message: msg }
        }
        if (
          !data ||
          typeof data !== 'object' ||
          !('id' in data) ||
          typeof (data as Product).id !== 'string'
        ) {
          return {
            kind: 'error' as const,
            message: '商品数据异常，请重试',
          }
        }
        return { kind: 'ok' as const, data: data as Product }
      }

      try {
        let result = await fetchOnce()
        if (result.kind === 'error') {
          await new Promise((r) => setTimeout(r, 450))
          if (!ac.signal.aborted) {
            result = await fetchOnce()
          }
        }

        if (ac.signal.aborted) return

        if (result.kind === 'not_found') {
          setProduct(null)
          setLoadError(null)
        } else if (result.kind === 'error') {
          setProduct(null)
          setLoadError(result.message)
        } else {
          setProduct(result.data)
          setLoadError(null)
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setProduct(null)
        setLoadError('网络异常，请稍后重试')
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    }

    void run()
    return () => ac.abort()
  }, [productId, detailRetryKey, router])

  // 自动轮播功能
  useEffect(() => {
    if (!product) return
    
    const images = parseProductImages(product.images)
    if (images.length <= 1) {
      setAutoPlay(false)
      return
    }

    if (autoPlay) {
      const interval = setInterval(() => {
        setSelectedImageIndex((prev) => (prev + 1) % images.length)
      }, 3000) // 每3秒切换一次

      return () => clearInterval(interval)
    }
  }, [autoPlay, product])

  const handlePreviousImage = () => {
    if (!product) return
    const images = parseProductImages(product.images)
    if (images.length <= 1) return
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
    setAutoPlay(false) // 手动切换时停止自动播放
  }

  const handleNextImage = () => {
    if (!product) return
    const images = parseProductImages(product.images)
    if (images.length <= 1) return
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
    setAutoPlay(false) // 手动切换时停止自动播放
  }

  const handleAddToCart = async () => {
    if (!user) {
      alert('请先登录')
      router.push('/login')
      return
    }

    const images = product ? parseProductImages(product.images) : []
    const imageSrc = images[selectedImageIndex] || (images[0] ?? '')
    const rect = productImageRef.current?.getBoundingClientRect()

    if (imageSrc && rect) {
      setFlyToCart({ imageSrc, fromRect: rect })
    }

    const token = localStorage.getItem('token')
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product?.id,
          quantity
        })
      })

      if (response.ok) {
        if (!imageSrc || !rect) showToast('已加入购物车')
      } else {
        setFlyToCart(null)
        const data = await response.json()
        alert(data.error || '加入购物车失败')
      }
    } catch (error) {
      setFlyToCart(null)
      console.error('加入购物车失败:', error)
      alert('加入购物车失败，请稍后重试')
    }
  }

  const handleFlyToCartComplete = () => {
    setFlyToCart(null)
    showToast('已加入购物车')
  }

  const handleBuyNowClick = () => {
    if (!user) {
      alert('请先登录')
      router.push('/login')
      return
    }
    setCheckoutOpen(true)
  }

  const handleBuyNowSubmit = async (form: { shippingName: string; shippingPhone: string; shippingAddress: string }) => {
    const token = localStorage.getItem('token')
    if (!token || !product) return
    setCheckoutLoading(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity }],
          shippingAddress: form.shippingAddress,
          shippingName: form.shippingName,
          shippingPhone: form.shippingPhone
        })
      })

      if (response.ok) {
        const order = await response.json()
        showToast('订单创建成功！')
        setCheckoutOpen(false)
        router.push(`/orders/${order.id}`)
      } else {
        const data = await response.json()
        alert(data.error || '创建订单失败')
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('创建订单失败:', error)
      alert('创建订单失败，请稍后重试')
      throw error
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
            <p className="mt-4 text-gray-600">加载中…</p>
          </div>
        </div>
      </>
    )
  }

  if (!loading && loadError) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📡</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">商品加载失败</h1>
            <p className="text-gray-600 mb-6">{loadError}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDetailRetryKey((k) => k + 1)}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800"
              >
                重试
              </button>
              <Link
                href="/products"
                className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg font-semibold hover:bg-gray-200 inline-block"
              >
                返回列表
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!loading && !product) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">未找到商品</h1>
            <p className="text-gray-600 mb-2">
              该商品不存在、已下架或已被移除。
            </p>
            {productId && (
              <p className="text-sm text-gray-500 mb-6">
                商品 ID：{productId}
              </p>
            )}
            <div className="flex gap-4 justify-center">
              <Link 
                href="/products" 
                className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold"
              >
                浏览商品
              </Link>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
              >
                返回上页
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!product) return null

  const images = parseProductImages(product.images)

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <Link href="/products" className="text-gray-900 hover:underline mb-6 inline-block">
            ← 返回商品列表
          </Link>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
              {/* Product Images */}
              <div>
                {/* 主图片轮播区域 */}
                <div
                  ref={productImageRef}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4 relative group"
                >
                  <div className="relative w-full h-full overflow-hidden">
                    {images.map((img: string, index: number) => (
                      <div
                        key={index}
                        className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out ${
                          selectedImageIndex === index
                            ? 'opacity-100 translate-x-0 scale-100 z-10'
                            : selectedImageIndex > index
                            ? 'opacity-0 -translate-x-full scale-95 z-0'
                            : 'opacity-0 translate-x-full scale-95 z-0'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ))}
                    {images.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-8xl">🏀</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 平台自营标签 */}
                  {product.sourceType === 'PLATFORM_MANAGED' && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                        平台自营
                      </span>
                    </div>
                  )}

                  {/* 轮播控制按钮 - 多张图片时显示 */}
                  {images.length > 1 && (
                    <>
                      {/* 左箭头 */}
                      <button
                        onClick={handlePreviousImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                        aria-label="上一张图片"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* 右箭头 */}
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                        aria-label="下一张图片"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* 图片指示器 */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {images.map((_: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedImageIndex(index)
                              setAutoPlay(false)
                            }}
                            className={`h-2 rounded-full transition-all ${
                              selectedImageIndex === index
                                ? 'bg-white w-8'
                                : 'bg-white/50 w-2 hover:bg-white/75'
                            }`}
                            aria-label={`查看第 ${index + 1} 张图片`}
                          />
                        ))}
                      </div>

                      {/* 自动播放控制 */}
                      <button
                        onClick={() => setAutoPlay(!autoPlay)}
                        className="absolute top-4 right-4 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                        aria-label={autoPlay ? '暂停轮播' : '播放轮播'}
                      >
                        {autoPlay ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* 预览缩略图 - 多张图片时显示 */}
                {images.length > 1 && (
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 mt-2">
                    {images.map((img: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedImageIndex(index)
                          setAutoPlay(false)
                        }}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all relative ${
                          selectedImageIndex === index
                            ? 'border-gray-400 ring-2 ring-gray-200 scale-105'
                            : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} ${index + 1}`}
                          className={`w-full h-full object-cover transition-all duration-300 ${
                            selectedImageIndex === index
                              ? 'blur-0'
                              : 'blur-sm'
                          }`}
                        />
                        {selectedImageIndex === index && (
                          <div className="absolute inset-0 border-2 border-gray-400 rounded-lg pointer-events-none" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold mb-3">
                    {product.category.name}
                  </span>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center">
                      <span className="text-yellow-400 text-2xl">⭐</span>
                      <span className="ml-2 text-xl font-semibold text-gray-700">
                        {product.rating.toFixed(1)}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({product.reviewCount} 条评价)
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {product._count.orderItems} 笔成交
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-6">
                    ¥{product.price.toFixed(2)}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-gray-600 font-semibold">卖家：</span>
                        <span className="text-gray-900">{product.seller.username}</span>
                      </div>
                      {/* 只有商品所有者或管理员可以编辑 */}
                      {user && (user.id === product.seller.id || user.role === 'ADMIN') && (
                        <Link
                          href={`/products/${product.id}/edit`}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all text-sm font-semibold"
                        >
                          ✏️ 编辑商品
                        </Link>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600 font-semibold">库存：</span>
                      <span className={`font-semibold ${product.stock > 0 ? 'text-gray-700' : 'text-gray-500'}`}>
                        {product.stock > 0 ? `剩余 ${product.stock} 件` : '暂无库存'}
                      </span>
                    </div>
                    {product.status && product.status !== 'ACTIVE' && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠️ 当前商品状态为{' '}
                          {product.status === 'INACTIVE' ? '已下架/不可用' : product.status}
                          ，可能无法下单购买。
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity and Actions */}
                <div className="border-t border-gray-200 pt-6">
                  {user ? (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <label className="text-gray-700 font-semibold">数量：</label>
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="px-4 py-2 hover:bg-gray-100 transition-colors"
                            disabled={quantity <= 1}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={product.stock}
                            value={quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1
                              setQuantity(Math.max(1, Math.min(val, product.stock)))
                            }}
                            className="w-20 text-center border-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                            className="px-4 py-2 hover:bg-gray-100 transition-colors"
                            disabled={quantity >= product.stock}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={handleAddToCart}
                          disabled={product.stock <= 0}
                          className="flex-1 px-6 py-4 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          🛒 加入购物车
                        </button>
                        <button
                          onClick={handleBuyNowClick}
                          disabled={product.stock <= 0}
                          className="flex-1 px-6 py-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          立即购买
                        </button>
                      </div>
                      {product.stock <= 0 && (
                        <p className="text-amber-600 font-medium mt-2">暂无库存</p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-600 py-2">
                      <Link href="/login" className="text-gray-900 font-semibold hover:underline">登录</Link>
                      {' '}后可加入购物车或购买
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="border-t border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">商品详情</h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {product.description}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CheckoutDrawer
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSubmit={handleBuyNowSubmit}
        loading={checkoutLoading}
        totalAmount={product ? product.price * quantity : 0}
        itemCount={quantity}
      />

      <FlyToCart
        active={!!flyToCart}
        imageSrc={flyToCart?.imageSrc ?? ''}
        fromRect={flyToCart?.fromRect ?? null}
        onComplete={handleFlyToCartComplete}
      />
    </>
  )
}
