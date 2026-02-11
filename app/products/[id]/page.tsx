'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

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
  _count: { reviews: number; orderItems: number }
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [autoPlay, setAutoPlay] = useState(false)
  const [user, setUser] = useState<any>(null)

  const productId = Array.isArray(params.id) ? params.id[0] : params.id

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (productId) {
      console.log('ProductDetailPage: productId from params:', productId)
      fetchProduct()
    } else {
      console.error('ProductDetailPage: No product ID in params')
      setLoading(false)
      router.push('/products')
    }
  }, [productId])

  // 自动轮播功能
  useEffect(() => {
    if (!product) return
    
    const images = product.images ? JSON.parse(product.images) : []
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
    const images = product.images ? JSON.parse(product.images) : []
    if (images.length <= 1) return
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
    setAutoPlay(false) // 手动切换时停止自动播放
  }

  const handleNextImage = () => {
    if (!product) return
    const images = product.images ? JSON.parse(product.images) : []
    if (images.length <= 1) return
    setSelectedImageIndex((prev) => (prev + 1) % images.length)
    setAutoPlay(false) // 手动切换时停止自动播放
  }

  const fetchProduct = async () => {
    if (!productId) {
      console.error('No product ID provided')
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      console.log('Fetching product:', productId)
      const response = await fetch(`/api/products/${productId}`)
      console.log('Product API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Product data received:', data)
        
        // Check if product is active
        if (data.status && data.status !== 'ACTIVE') {
          console.warn('Product is not active, status:', data.status)
        }
        
        setProduct(data)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to fetch product:', response.status, errorData)
        
        // Don't show alert immediately, let the UI handle it
        setProduct(null)
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please login first')
      router.push('/login')
      return
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
        alert('Added to cart successfully!')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to add to cart')
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add to cart, please try again')
    }
  }

  const handleBuyNow = async () => {
    if (!user) {
      alert('Please login first')
      router.push('/login')
      return
    }

    const token = localStorage.getItem('token')
    try {
      const shippingAddress = prompt('Please enter your shipping address:')
      const shippingName = prompt('Please enter your name:')
      const shippingPhone = prompt('Please enter your phone number:')

      if (!shippingAddress || !shippingName || !shippingPhone) {
        alert('Please fill in all shipping information')
        return
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: [{
            productId: product?.id,
            quantity
          }],
          shippingAddress,
          shippingName,
          shippingPhone
        })
      })

      if (response.ok) {
        const order = await response.json()
        alert('Order created successfully!')
        router.push(`/orders/${order.id}`)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('Failed to create order, please try again')
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-2">
              The product you're looking for doesn't exist or has been removed.
            </p>
            {productId && (
              <p className="text-sm text-gray-500 mb-6">
                Product ID: {productId}
              </p>
            )}
            <div className="flex gap-4 justify-center">
              <Link 
                href="/products" 
                className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-semibold"
              >
                Browse Products
              </Link>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  const images = product.images ? JSON.parse(product.images) : []

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <Link href="/products" className="text-orange-600 hover:underline mb-6 inline-block">
            ← Back to Products
          </Link>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
              {/* Product Images */}
              <div>
                {/* 主图片轮播区域 */}
                <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 rounded-lg overflow-hidden mb-4 relative group">
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
                  
                  {/* 平台管理标签 */}
                  {product.sourceType === 'PLATFORM_MANAGED' && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                        Platform Managed
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
                        aria-label="Previous image"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      {/* 右箭头 */}
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                        aria-label="Next image"
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
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>

                      {/* 自动播放控制 */}
                      <button
                        onClick={() => setAutoPlay(!autoPlay)}
                        className="absolute top-4 right-4 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                        aria-label={autoPlay ? 'Pause slideshow' : 'Play slideshow'}
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
                            ? 'border-orange-600 ring-2 ring-orange-200 scale-105'
                            : 'border-gray-200 hover:border-orange-400 opacity-70 hover:opacity-100'
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
                          <div className="absolute inset-0 border-2 border-orange-600 rounded-lg pointer-events-none" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full text-sm font-semibold mb-3">
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
                        ({product.reviewCount} reviews)
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {product._count.orderItems} orders
                    </span>
                  </div>
                  <div className="text-4xl font-bold text-orange-600 mb-6">
                    ¥{product.price.toFixed(2)}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-gray-600 font-semibold">Seller: </span>
                        <span className="text-gray-900">{product.seller.username}</span>
                      </div>
                      {/* 只有商品所有者或管理员可以编辑 */}
                      {user && (user.id === product.seller.id || user.role === 'ADMIN') && (
                        <Link
                          href={`/products/${product.id}/edit`}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all text-sm font-semibold"
                        >
                          ✏️ Edit Product
                        </Link>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-600 font-semibold">Stock: </span>
                      <span className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                      </span>
                    </div>
                    {product.status && product.status !== 'ACTIVE' && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠️ This product is currently {product.status === 'INACTIVE' ? 'inactive' : product.status.toLowerCase()}. It may not be available for purchase.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quantity and Actions */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-4 mb-6">
                    <label className="text-gray-700 font-semibold">Quantity:</label>
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
                      disabled={product.stock === 0}
                      className="flex-1 px-6 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      🛒 Add to Cart
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={product.stock === 0}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="border-t border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {product.description}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
