'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import AdminNav from '@/components/AdminNav'

interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  images: string
  status: string
  sourceType?: string
  createdAt: string
  seller: { username: string }
  category: { name: string }
  _count: { reviews: number; orderItems: number }
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'all'>('active')
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userData)
    if (user.role !== 'ADMIN') {
      alert('You do not have permission to access this page')
      router.push('/dashboard')
      return
    }

    fetchProducts()
  }, [router, activeTab])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const status = activeTab === 'all' ? 'all' : activeTab === 'active' ? 'ACTIVE' : 'INACTIVE'
      const response = await fetch(`/api/products/review?status=${status}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      } else {
        console.error('Failed to fetch product list')
      }
    } catch (error) {
      console.error('Failed to fetch product list:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (productId: string, action: 'approve' | 'reject') => {
    if (!confirm(action === 'approve' ? 'Are you sure you want to approve this product?' : 'Are you sure you want to withdraw this product?')) {
      return
    }

    setProcessing(productId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/products/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, action })
      })

      if (response.ok) {
        alert(action === 'approve' ? 'Product approved' : 'Product withdrawn')
        fetchProducts()
      } else {
        const data = await response.json()
        alert(data.error || 'Operation failed')
      }
    } catch (error) {
      console.error('Review failed:', error)
      alert('Operation failed, please try again')
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US')
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'ACTIVE': { text: 'Active', color: 'bg-green-100 text-green-800' },
      'INACTIVE': { text: 'Withdrawn', color: 'bg-red-100 text-red-800' },
      'PENDING': { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' }
    }
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
  }

  return (
    <>
      <Header />
      <AdminNav />
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 text-gray-900 flex items-center">
              <span className="mr-3">🛒</span>
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Product Review</span>
            </h1>
            <p className="text-xl text-gray-600">Review and manage platform products</p>
          </div>

          {/* 标签导航 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="flex space-x-1 px-6">
                {[
                  { id: 'active', name: 'Active', count: products.filter(p => p.status === 'ACTIVE').length },
                  { id: 'inactive', name: 'Withdrawn', count: products.filter(p => p.status === 'INACTIVE').length },
                  { id: 'all', name: 'All Products', count: products.length }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-4 font-semibold text-sm transition-all relative ${
                      activeTab === tab.id
                        ? 'text-orange-600 bg-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {tab.name}
                    {tab.count > 0 && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        activeTab === tab.id ? 'bg-orange-100 text-orange-600' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* 内容区域 */}
            <div className="p-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No products</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => {
                    const images = product.images ? JSON.parse(product.images) : []
                    return (
                      <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex gap-6">
                          {/* 商品图片 */}
                          <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                            {images[0] ? (
                              <img
                                src={images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const placeholder = target.parentElement?.querySelector('.no-image')
                                  if (placeholder) {
                                    (placeholder as HTMLElement).style.display = 'flex'
                                  }
                                }}
                              />
                            ) : null}
                            <div className="no-image absolute inset-0 flex items-center justify-center" style={{ display: images[0] ? 'none' : 'flex' }}>
                              <span className="text-3xl">🏀</span>
                            </div>
                          </div>

                          {/* 商品信息 */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                                  {product.sourceType === 'PLATFORM_MANAGED' ? (
                                    <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                                      Platform Managed
                                    </span>
                                  ) : (
                                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                                      Free Trade
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 text-sm line-clamp-2 mb-2">{product.description}</p>
                              </div>
                              <div className="ml-4">
                                {getStatusBadge(product.status)}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                              <div>
                                <span className="text-gray-500">Price: </span>
                                <span className="font-semibold text-orange-600">¥{product.price.toFixed(2)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Stock: </span>
                                <span className="font-semibold">{product.stock}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Category: </span>
                                <span className="font-semibold">{product.category.name}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Seller: </span>
                                <span className="font-semibold">{product.seller.username}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                              <span>Published: {formatDate(product.createdAt)}</span>
                              <span>Reviews: {product._count.reviews} | Orders: {product._count.orderItems}</span>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex gap-3">
                              {product.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => handleReview(product.id, 'reject')}
                                  disabled={processing === product.id}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processing === product.id ? 'Processing...' : 'Withdraw Product'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReview(product.id, 'approve')}
                                  disabled={processing === product.id}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {processing === product.id ? 'Processing...' : 'Approve Product'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
