'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

interface Order {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  createdAt: string
  items: Array<{ product: { name: string } }>
}

interface Favorite {
  id: string
  type: string
  product?: { id: string; name: string; price: number; images: string }
  post?: { id: string; title: string }
}

interface Post {
  id: string
  title: string
  content: string
  status: string
  views: number
  likes: number
  createdAt: string
}

interface Comment {
  id: string
  content: string
  createdAt: string
  post?: { id: string; title: string }
  product?: { id: string; name: string }
}

// 个人信息组件
function ProfileSection({ user, onUpdate, formatDate, onTabChange }: { user: any, onUpdate: () => void, formatDate: (date: string) => string, onTabChange: (tab: string) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editData, setEditData] = useState({
    phone: user.phone || '',
    avatar: user.avatar || ''
  })

  const handleSave = async () => {
    setLoading(true)
    const token = localStorage.getItem('token')
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        setIsEditing(false)
        onUpdate()
      } else {
        const data = await response.json()
        alert(data.error || 'Update failed')
      }
    } catch (error) {
      console.error('Update failed:', error)
      alert('Update failed, please try again')
    } finally {
      setLoading(false)
    }
  }

  const resizeImage = (file: File, maxSize = 200): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      img.onload = () => {
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize
            width = maxSize
          } else {
            width = (width / height) * maxSize
            height = maxSize
          }
        }
        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        resolve(dataUrl)
      }
      img.onerror = () => resolve('')
      img.src = URL.createObjectURL(file)
    })
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const dataUrl = await resizeImage(file)
      if (dataUrl) setEditData((prev) => ({ ...prev, avatar: dataUrl }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsEditing(false)
                setEditData({ phone: user.phone || '', avatar: user.avatar || '' })
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* 头像区域 */}
      <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-4xl font-bold text-white">
            {editData.avatar ? (
              <img src={editData.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <span>{user.username.charAt(0).toUpperCase()}</span>
            )}
          </div>
          {isEditing && (
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors shadow-lg">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </label>
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{user.username}</h3>
          <p className="text-gray-600">{user.email}</p>
          {isEditing && (
            <p className="text-xs text-gray-500 mt-2">Click the icon at the bottom right of the avatar to change it</p>
          )}
        </div>
      </div>

      {/* 信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
          <p className="text-gray-900 text-lg font-medium">{user.username}</p>
          <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <p className="text-gray-900 text-lg font-medium">{user.email}</p>
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
          {isEditing ? (
            <input
              type="tel"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none"
              placeholder="Enter phone number"
            />
          ) : (
            <>
              <p className="text-gray-900 text-lg font-medium">{user.phone || 'Not set'}</p>
              {!user.phone && (
                <p className="text-xs text-gray-500 mt-1">Click Edit Profile to set phone number</p>
              )}
            </>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
              {user.role === 'ADMIN' ? '管理员' : user.isSeller ? '卖家' : '普通用户'}
            </span>
            {user.isSeller && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                Seller Verified
              </span>
            )}
          </div>
        </div>

        {user.balance !== undefined && (
          <div className="bg-gradient-to-br bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Account Balance</label>
            <p className="text-gray-900 text-3xl font-bold">¥{user.balance.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2">Available for purchasing products</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Registration Date</label>
          <p className="text-gray-900 text-lg font-medium">{formatDate(user.createdAt)}</p>
          <p className="text-xs text-gray-500 mt-1">Account creation time</p>
        </div>
      </div>

    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [sellerProducts, setSellerProducts] = useState<any[]>([])
  const [stats, setStats] = useState({
    orders: 0,
    favorites: 0,
    posts: 0,
    comments: 0,
    sellerProducts: 0
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
    fetchProfile()
  }, [router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, activeTab])

  const fetchProfile = async () => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      }
    } catch (error) {
      console.error('Failed to fetch user information:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // 获取订单
      const ordersRes = await fetch('/api/users/my-orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(Array.isArray(ordersData) ? ordersData : [])
      }

      // 获取收藏
      const favoritesRes = await fetch('/api/users/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (favoritesRes.ok) {
        const favoritesData = await favoritesRes.json()
        setFavorites(Array.isArray(favoritesData) ? favoritesData : [])
      }

      // 获取帖子
      const postsRes = await fetch('/api/users/my-posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (postsRes.ok) {
        const postsData = await postsRes.json()
        setPosts(Array.isArray(postsData) ? postsData : [])
      }

      // 获取评论
      const commentsRes = await fetch('/api/users/my-comments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json()
        setComments(Array.isArray(commentsData) ? commentsData : [])
      }

      // 如果是卖家，获取卖出的商品
      if (user.isSeller) {
        const productsRes = await fetch('/api/users/my-products', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setSellerProducts(Array.isArray(productsData) ? productsData : [])
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  useEffect(() => {
    setStats({
      orders: orders.length,
      favorites: favorites.length,
      posts: posts.length,
      comments: comments.length,
      sellerProducts: sellerProducts.length
    })
  }, [orders, favorites, posts, comments, sellerProducts])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'PENDING_PAYMENT': { text: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800' },
      'PAID': { text: 'Paid', color: 'bg-blue-100 text-blue-800' },
      'SHIPPED': { text: 'Shipped', color: 'bg-purple-100 text-purple-800' },
      'COMPLETED': { text: 'Completed', color: 'bg-green-100 text-green-800' },
      'CANCELLED': { text: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
      'PENDING': { text: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
      'APPROVED': { text: 'Approved', color: 'bg-green-100 text-green-800' },
      'REJECTED': { text: 'Rejected', color: 'bg-red-100 text-red-800' }
    }
    const statusInfo = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        {statusInfo.text}
      </span>
    )
  }

  if (loading || !user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 用户信息卡片 */}
          <div className="bg-gray-200 rounded-2xl shadow-lg p-8 mb-8 text-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-4xl font-bold">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{user.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">{user.username}</h1>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="px-3 py-1 bg-gray-300 rounded-full text-sm">
                      {user.role === 'ADMIN' ? 'Admin' : user.isSeller ? 'Seller' : 'User'}
                    </span>
                    {user.balance !== undefined && (
                      <span className="px-3 py-1 bg-gray-300 rounded-full text-sm">
                        Balance: ¥{user.balance.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className={`grid grid-cols-2 ${user.isSeller ? 'md:grid-cols-4' : 'md:grid-cols-4'} gap-4 mb-8`}>
            {!user.isSeller && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">My Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.orders}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">My Favorites</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.favorites}</p>
                </div>
<div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">My Posts</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.posts}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">My Comments</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.comments}</p>
                </div>
<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {user.isSeller && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">My Products</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.sellerProducts}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 主要内容区域 */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {/* 标签导航 */}
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="flex space-x-1 px-6 overflow-x-auto">
                {[
                  { id: 'profile', name: 'Profile', icon: '👤' },
                  ...(!user.isSeller ? [{ id: 'orders', name: 'My Orders', icon: '📦' }] : []),
                  { id: 'favorites', name: 'My Favorites', icon: '❤️' },
                  { id: 'posts', name: 'My Posts', icon: '📝' },
                  { id: 'comments', name: 'My Comments', icon: '💬' },
                  ...(user.isSeller ? [{ id: 'products', name: 'My Products', icon: '🏪' }] : [])
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-4 font-semibold text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                      ? 'text-gray-900 border-b-2 border-gray-900 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* 内容区域 */}
            <div className="p-8">
              {/* 个人信息 */}
              {activeTab === 'profile' && (
                <ProfileSection user={user} onUpdate={fetchProfile} formatDate={formatDate} onTabChange={setActiveTab} />
              )}

              {/* 我的订单 */}
              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h2>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <p className="text-gray-500 text-lg">No orders</p>
                      <Link href="/products" className="text-gray-900 hover:underline mt-2 inline-block">
                        Go Shopping →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <Link key={order.id} href={`/orders/${order.id}`}>
                          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="font-semibold text-gray-900">Order No.: {order.orderNumber}</p>
                                <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                              </div>
                              {getStatusBadge(order.status)}
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">
                                  {order.items?.length > 0 ? `${order.items[0].product.name}${order.items.length > 1 ? ` and ${order.items.length - 1} more items` : ''}` : 'Product Information'}
                                </p>
                              </div>
                              <p className="text-lg font-bold text-gray-900">¥{order.totalAmount.toFixed(2)}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 我的收藏 */}
              {activeTab === 'favorites' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">My Favorites</h2>
                  {favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <p className="text-gray-500 text-lg">No favorites</p>
                      <Link href="/products" className="text-gray-900 hover:underline mt-2 inline-block">
                        Browse Products →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favorites.map((favorite) => (
                        <div key={favorite.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          {favorite.type === 'PRODUCT' && favorite.product ? (
                            <Link href={`/products/${favorite.product.id}`}>
                              <div className="p-4">
                                <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                  {favorite.product.images ? (
                                    <img
                                      src={JSON.parse(favorite.product.images)[0]}
                                      alt={favorite.product.name}
                                      className="w-full h-full object-cover rounded-lg"
                                    />
                                  ) : (
                                    <span className="text-4xl">🏀</span>
                                  )}
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{favorite.product.name}</h3>
                                <p className="text-gray-900 font-bold">¥{favorite.product.price.toFixed(2)}</p>
                              </div>
                            </Link>
                          ) : favorite.type === 'POST' && favorite.post ? (
                            <Link href={`/posts/${favorite.post.id}`}>
                              <div className="p-4">
                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{favorite.post.title}</h3>
                                <p className="text-sm text-gray-500">Post</p>
                              </div>
                            </Link>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 我的帖子 */}
              {activeTab === 'posts' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">My Posts</h2>
                    <Link href="/posts/new" className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold">
                      + New Post
                    </Link>
                  </div>
                  {posts.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-lg">No posts</p>
                      <Link href="/posts/new" className="text-gray-900 hover:underline mt-2 inline-block">
                        Create Your First Post →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <Link key={post.id} href={`/posts/${post.id}`}>
                          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-xl font-bold text-gray-900 flex-1 line-clamp-2">{post.title}</h3>
                              {getStatusBadge(post.status)}
                            </div>
                            <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <span>👁️ {post.views}</span>
                              <span>❤️ {post.likes}</span>
                              <span>{formatDate(post.createdAt)}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 我的评论 */}
              {activeTab === 'comments' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">My Comments</h2>
                  {comments.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-gray-500 text-lg">No comments</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                          <p className="text-gray-900 mb-3">{comment.content}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div>
                              {comment.post && (
                                <Link href={`/posts/${comment.post.id}`} className="text-gray-900 hover:underline">
                                  Post: {comment.post.title}
                                </Link>
                              )}
                              {comment.product && (
                                <Link href={`/products/${comment.product.id}`} className="text-gray-900 hover:underline">
                                  Product: {comment.product.name}
                                </Link>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <span>{formatDate(comment.createdAt)}</span>
                              <button className="text-gray-600 hover:text-gray-800">Delete</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 我的商品（卖家） */}
              {activeTab === 'products' && user.isSeller && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">My Products</h2>
                    <Link href="/products/new" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold">
                      ➕ Add Product
                    </Link>
                  </div>
                  {sellerProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-gray-500 text-lg">No products</p>
                      <Link href="/products/new" className="text-gray-900 hover:underline mt-2 inline-block">
                        Create Your First Product →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sellerProducts.map((product) => {
                        const images = product.images ? JSON.parse(product.images) : []
                        return (
                          <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                            <Link href={`/products/${product.id}`}>
                              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                                {images[0] ? (
                                  <img
                                    src={images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-6xl">🏀</span>
                                )}
                                <div className="absolute top-4 right-4">
                                  {getStatusBadge(product.status)}
                                </div>
                              </div>
                            </Link>
                            <div className="p-4">
                              <Link href={`/products/${product.id}`}>
                                <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 hover:text-gray-600 transition-colors">
                                  {product.name}
                                </h3>
                              </Link>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl font-bold text-gray-900">
                                  ¥{product.price.toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  Stock: {product.stock}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                                <span>Sales: {product.salesCount || 0}</span>
                                <div className="flex items-center">
                                  <span className="text-yellow-400">⭐</span>
                                  <span className="ml-1">{product.rating.toFixed(1)}</span>
                                  <span className="ml-2">({product.reviewCount || 0})</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Link
                                  href={`/products/${product.id}/edit`}
                                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold text-center"
                                >
                                  Edit
                                </Link>
                                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold">
                                  Delist
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
