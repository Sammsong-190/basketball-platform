'use client'

import { useState, useEffect, useRef } from 'react'
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
  refunds?: Array<{ id: string; status: string }>
}

function canRequestRefund(order: Order): boolean {
  if (
    ['REFUNDING', 'REFUNDED', 'PENDING_PAYMENT', 'CANCELLED'].includes(
      order.status
    )
  )
    return false
  if (!['PAID', 'SHIPPED', 'COMPLETED'].includes(order.status)) return false
  if (order.refunds?.some((r) => r.status === 'PENDING')) return false
  return true
}

interface Favorite {
  id: string
  type: string
  targetId: string
  createdAt: string
  post?: { id: string; title: string; author?: { username: string }; status?: string; createdAt?: string } | null
  comment?: {
    id: string
    content: string
    author?: { username: string }
    post?: { id: string; title: string } | null
    product?: { id: string; name: string } | null
  } | null
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
  const [walletBusy, setWalletBusy] = useState(false)
  const [rechargeAmt, setRechargeAmt] = useState('')
  const [editData, setEditData] = useState({
    phone: user.phone || '',
    avatar: user.avatar || ''
  })

  const handleWalletRecharge = async () => {
    const raw = parseFloat(rechargeAmt)
    if (Number.isNaN(raw) || raw < 1) {
      alert('请输入充值金额（至少 1 元）')
      return
    }
    setWalletBusy(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/users/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: raw }),
      })
      const data = await res.json()
      if (res.ok) {
        setRechargeAmt('')
        const msg = [data.message, data.warning].filter(Boolean).join('\n\n')
        alert(msg || '充值成功')
        onUpdate()
      } else {
        const msg = [data.error, data.hint, data.details].filter(Boolean).join('\n\n')
        alert(msg || '充值失败')
      }
    } catch {
      alert('充值失败')
    } finally {
      setWalletBusy(false)
    }
  }

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
        alert(data.error || '更新失败')
      }
    } catch (error) {
      console.error('保存失败:', error)
      alert('更新失败，请稍后重试')
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
        <h2 className="text-2xl font-bold text-gray-900">个人信息</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold"
          >
            编辑资料
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
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold disabled:opacity-50"
            >
              {loading ? '保存中…' : '保存'}
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
            <p className="text-xs text-gray-500 mt-2">编辑模式下点击头像右下角图标可更换头像</p>
          )}
        </div>
      </div>

      {/* 信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">用户名</label>
          <p className="text-gray-900 text-lg font-medium">{user.username}</p>
          <p className="text-xs text-gray-500 mt-1">用户名不可修改</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">邮箱</label>
          <p className="text-gray-900 text-lg font-medium">{user.email}</p>
          <p className="text-xs text-gray-500 mt-1">邮箱不可修改</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">手机</label>
          {isEditing ? (
            <input
              type="tel"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none"
              placeholder="请输入手机号"
            />
          ) : (
            <>
              <p className="text-gray-900 text-lg font-medium">{user.phone || '未填写'}</p>
              {!user.phone && (
                <p className="text-xs text-gray-500 mt-1">点击「编辑资料」可填写手机号</p>
              )}
            </>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">身份</label>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
              {user.role === 'ADMIN' ? '管理员' : user.isSeller ? '卖家' : '用户'}
            </span>
            {user.isSeller && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                已认证卖家
              </span>
            )}
          </div>
        </div>

        {user.balance !== undefined && (
          <div className="bg-gradient-to-br bg-gray-50 rounded-xl p-6 border-2 border-gray-200 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">账户余额</label>
            <p className="text-gray-900 text-3xl font-bold">¥{Number(user.balance).toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-2 mb-4">
              下单支付时从余额扣除；余额不足则无法付款。请通过下方充值增加余额（可多次充值累加）。
            </p>
            <div className="pt-4 border-t border-gray-200 space-y-2 max-w-md">
              <label className="block text-xs font-semibold text-gray-600">充值金额（元）</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={rechargeAmt}
                  onChange={(e) => setRechargeAmt(e.target.value)}
                  placeholder="最少 1 元"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  type="button"
                  disabled={walletBusy}
                  onClick={handleWalletRecharge}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50"
                >
                  充值
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">注册时间</label>
          <p className="text-gray-900 text-lg font-medium">{formatDate(user.createdAt)}</p>
          <p className="text-xs text-gray-500 mt-1">账号创建时间</p>
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
  const [incomes, setIncomes] = useState<{ incomes: Array<{ amount: number; description?: string; createdAt: string }>; total: number }>({ incomes: [], total: 0 })
  const [expenses, setExpenses] = useState<{ expenses: Array<{ amount: number; description?: string; createdAt: string }>; total: number }>({ expenses: [], total: 0 })
  const [complaints, setComplaints] = useState<Array<{ id: string; type: string; title: string; content: string; status: string; reply?: string; createdAt: string }>>([])
  const [refunds, setRefunds] = useState<Array<{ id: string; orderId: string; type: string; reason: string; amount: number; status: string; createdAt: string; order?: { orderNumber: string } }>>([])
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; body: string; read: boolean; refundId?: string | null; orderId?: string | null; createdAt: string }>>([])
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null)
  const [refundType, setRefundType] = useState('REFUND')
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)
  const [productStatusBusyId, setProductStatusBusyId] = useState<string | null>(null)
  const [productDeleteBusyId, setProductDeleteBusyId] = useState<string | null>(null)
  const [showComplaintForm, setShowComplaintForm] = useState(false)
  const [complaintForm, setComplaintForm] = useState({ type: 'COMPLAINT', title: '', content: '', orderId: '' })
  const [stats, setStats] = useState({
    orders: 0,
    favorites: 0,
    posts: 0,
    comments: 0,
    sellerProducts: 0
  })

  /** 并发 fetchData 时递增，只有最新一轮允许写回 state，避免旧请求用空列表覆盖新数据 */
  const dashboardFetchGen = useRef(0)
  const initialDashboardLoaded = useRef(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
  }, [router])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void (async () => {
      await fetchData()
      if (!cancelled && !initialDashboardLoaded.current) {
        initialDashboardLoaded.current = true
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
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
        const normalizedIsSeller =
          data.isSeller === true || data.isSeller === 'true'
        setUser({ ...data, isSeller: normalizedIsSeller })
        const prevRaw = localStorage.getItem('user')
        const prev = prevRaw ? JSON.parse(prevRaw) : {}
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...prev,
            id: data.id,
            username: data.username,
            email: data.email,
            role: data.role,
            isSeller: normalizedIsSeller,
            avatar: data.avatar,
            balance: data.balance,
          })
        )
      }
    } catch (error) {
      console.error('获取用户资料失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchData = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    const gen = ++dashboardFetchGen.current
    const isStale = () => gen !== dashboardFetchGen.current

    let sellerCapable =
      user?.isSeller === true ||
      user?.isSeller === 'true' ||
      user?.role === 'ADMIN'

    try {
      const pr = await fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (isStale()) return

      if (pr.ok) {
        const p = await pr.json()
        sellerCapable =
          p.role === 'ADMIN' ||
          p.isSeller === true ||
          p.isSeller === 'true'

        const normalizedIsSeller =
          p.isSeller === true || p.isSeller === 'true'

        setUser((prev: any) => {
          if (!prev) return prev
          const nextBalance =
            typeof p.balance === 'number' ? p.balance : prev.balance
          const nextAvatar = p.avatar ?? prev.avatar
          if (
            prev.isSeller === normalizedIsSeller &&
            prev.role === p.role &&
            prev.balance === nextBalance &&
            prev.avatar === nextAvatar
          ) {
            return prev
          }
          const merged = {
            ...prev,
            isSeller: normalizedIsSeller,
            role: p.role,
            balance: nextBalance,
            avatar: nextAvatar,
          }
          try {
            const prevRaw = localStorage.getItem('user')
            if (prevRaw) {
              const o = JSON.parse(prevRaw)
              localStorage.setItem(
                'user',
                JSON.stringify({
                  ...o,
                  isSeller: merged.isSeller,
                  role: merged.role,
                  balance: merged.balance,
                  avatar: merged.avatar,
                })
              )
            }
          } catch {
            /* ignore */
          }
          return merged
        })
      }
    } catch {
      /* 资料失败时用进入函数时的 user 推断 sellerCapable */
    }

    const sellerCapableFromProfile = sellerCapable
    if (isStale()) return

    try {
      const ordersRes = await fetch('/api/users/my-orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (isStale()) return
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        if (isStale()) return
        setOrders(Array.isArray(ordersData) ? ordersData : [])
      }

      const favoritesRes = await fetch('/api/users/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (isStale()) return
      if (favoritesRes.ok) {
        const favoritesData = await favoritesRes.json()
        if (isStale()) return
        setFavorites(Array.isArray(favoritesData) ? favoritesData : [])
      }

      const postsRes = await fetch('/api/users/my-posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (isStale()) return
      if (postsRes.ok) {
        const postsData = await postsRes.json()
        if (isStale()) return
        setPosts(Array.isArray(postsData) ? postsData : [])
      }

      const commentsRes = await fetch('/api/users/my-comments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (isStale()) return
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json()
        if (isStale()) return
        setComments(Array.isArray(commentsData) ? commentsData : [])
      }

      // 始终拉取「我的商品」，以接口为准；避免仅依赖前端 seller 判断或并发请求顺序导致列表被空结果覆盖
      const productsRes = await fetch('/api/users/my-products', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (isStale()) return

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        if (isStale()) return
        setSellerProducts(Array.isArray(productsData) ? productsData : [])

        if (!sellerCapableFromProfile) {
          setUser((prev: any) => {
            if (!prev) return prev
            if (prev.role === 'ADMIN' || prev.isSeller === true) return prev
            const merged = { ...prev, isSeller: true }
            try {
              const prevRaw = localStorage.getItem('user')
              if (prevRaw) {
                const o = JSON.parse(prevRaw)
                localStorage.setItem(
                  'user',
                  JSON.stringify({ ...o, isSeller: true })
                )
              }
            } catch {
              /* ignore */
            }
            return merged
          })
        }
      } else {
        if (isStale()) return
        setSellerProducts([])
      }

      const allowSellerExtras =
        sellerCapableFromProfile || productsRes.ok
      if (allowSellerExtras) {
        const incomesRes = await fetch('/api/users/incomes', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (isStale()) return
        if (incomesRes.ok) {
          const incomesData = await incomesRes.json()
          if (isStale()) return
          setIncomes(incomesData)
        }

        const notifRes = await fetch('/api/users/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (isStale()) return
        if (notifRes.ok) {
          const notifData = await notifRes.json()
          if (isStale()) return
          setNotifications(Array.isArray(notifData) ? notifData : [])
        }
      }

      const expensesRes = await fetch('/api/users/expenses', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (isStale()) return
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json()
        if (isStale()) return
        setExpenses(expensesData)
      }

      const complaintsRes = await fetch('/api/complaints', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (isStale()) return
      if (complaintsRes.ok) {
        const complaintsData = await complaintsRes.json()
        if (isStale()) return
        setComplaints(Array.isArray(complaintsData) ? complaintsData : [])
      }

      const refundsRes = await fetch('/api/refunds', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (isStale()) return
      if (refundsRes.ok) {
        const refundsData = await refundsRes.json()
        if (isStale()) return
        setRefunds(Array.isArray(refundsData) ? refundsData : [])
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    }
  }

  useEffect(() => {
    setStats({
      orders: orders.length,
      favorites: favorites.filter((f) => f.type === 'POST' || f.type === 'COMMENT').length,
      posts: posts.length,
      comments: comments.length,
      sellerProducts: sellerProducts.length
    })
  }, [orders, favorites, posts, comments, sellerProducts])

  const submitRefundFromDashboard = async () => {
    if (!refundModalOrder) return
    if (!refundReason.trim()) {
      alert('请填写退款原因')
      return
    }
    setRefunding(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: refundModalOrder.id,
          type: refundType,
          reason: refundReason,
          amount: refundModalOrder.totalAmount,
        }),
      })
      if (res.ok) {
        setRefundModalOrder(null)
        setRefundReason('')
        setRefundType('REFUND')
        fetchData()
      } else {
        const err = await res.json().catch(() => ({}))
        alert((err as { error?: string }).error || '提交失败')
      }
    } catch {
      alert('提交失败')
    } finally {
      setRefunding(false)
    }
  }

  const updateProductListingStatus = async (
    productId: string,
    status: 'ACTIVE' | 'INACTIVE'
  ) => {
    const label = status === 'INACTIVE' ? '下架' : '重新上架'
    if (!confirm(`确定要${label}该商品吗？`)) return
    const token = localStorage.getItem('token')
    if (!token) return
    setProductStatusBusyId(productId)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        await fetchData()
      } else {
        const d = await res.json().catch(() => ({}))
        alert((d as { error?: string }).error || '操作失败')
      }
    } catch {
      alert('操作失败，请稍后重试')
    } finally {
      setProductStatusBusyId(null)
    }
  }

  const permanentlyRemoveDeletedProduct = async (productId: string) => {
    if (
      !confirm(
        '确定要从列表中彻底删除该商品吗？此操作不可恢复（若该商品曾产生订单，相关明细可能被一并移除，请谨慎操作）。'
      )
    )
      return
    const token = localStorage.getItem('token')
    if (!token) return
    setProductDeleteBusyId(productId)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        await fetchData()
      } else {
        const d = await res.json().catch(() => ({}))
        alert((d as { error?: string }).error || '删除失败')
      }
    } catch {
      alert('删除失败，请稍后重试')
    } finally {
      setProductDeleteBusyId(null)
    }
  }

  const removeFavorite = async (favoriteId: string) => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch(`/api/users/favorites?id=${encodeURIComponent(favoriteId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        fetchData()
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || '取消收藏失败')
      }
    } catch {
      alert('取消收藏失败')
    }
  }

  /** 是否可管理「我的商品」：认证卖家或管理员（管理员也可能上架商品） */
  const canManageSellerListings =
    user != null &&
    (user.isSeller === true ||
      user.isSeller === 'true' ||
      user.role === 'ADMIN')

  const safeParseProductImages = (raw: unknown): string[] => {
    if (typeof raw !== 'string' || !raw) return []
    try {
      const x = JSON.parse(raw)
      return Array.isArray(x) ? x : []
    } catch {
      return []
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string } } = {
      'PENDING_PAYMENT': { text: '待付款', color: 'bg-yellow-100 text-yellow-800' },
      'PAID': { text: '已付款', color: 'bg-blue-100 text-blue-800' },
      'SHIPPED': { text: '已发货', color: 'bg-purple-100 text-purple-800' },
      'COMPLETED': { text: '已完成', color: 'bg-green-100 text-green-800' },
      'CANCELLED': { text: '已取消', color: 'bg-gray-100 text-gray-800' },
      'PENDING': { text: '待审核', color: 'bg-yellow-100 text-yellow-800' },
      'APPROVED': { text: '已通过', color: 'bg-green-100 text-green-800' },
      'REJECTED': { text: '已拒绝', color: 'bg-red-100 text-red-800' },
      'RESOLVED': { text: '已处理', color: 'bg-green-100 text-green-800' },
      'REFUNDING': { text: '退款中', color: 'bg-orange-100 text-orange-800' },
      'REFUNDED': { text: '已退款', color: 'bg-gray-100 text-gray-800' },
      'ACTIVE': { text: '上架中', color: 'bg-green-100 text-green-800' },
      'INACTIVE': { text: '已下架', color: 'bg-gray-100 text-gray-800' },
      'DELETED': { text: '已删除', color: 'bg-red-100 text-red-800' },
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
            <p className="mt-4 text-gray-600">加载中…</p>
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
                      {user.role === 'ADMIN' ? '管理员' : user.isSeller ? '卖家' : '用户'}
                    </span>
                    {user.balance !== undefined && (
                      <span className="px-3 py-1 bg-gray-300 rounded-full text-sm">
                        余额：¥{user.balance.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className={`grid grid-cols-2 ${user.isSeller ? 'md:grid-cols-4' : 'md:grid-cols-4'} gap-4 mb-8`}>
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left w-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">我的订单</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.orders}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center pointer-events-none">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
            </button>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">我的收藏</p>
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
                  <p className="text-sm text-gray-600 mb-1">我的帖子</p>
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
                  <p className="text-sm text-gray-600 mb-1">我的评论</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.comments}</p>
                </div>
<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {canManageSellerListings && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">我的商品</p>
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
                  { id: 'profile', name: '个人资料', icon: '👤' },
                  { id: 'orders', name: '我的订单', icon: '📦' },
                  { id: 'favorites', name: '我的收藏', icon: '❤️' },
                  { id: 'posts', name: '我的帖子', icon: '📝' },
                  { id: 'comments', name: '我的评论', icon: '💬' },
                  ...(canManageSellerListings ? [{ id: 'products', name: '我的商品', icon: '🏪' }, { id: 'incomes', name: '收入', icon: '💰' }] : []),
                  { id: 'expenses', name: '支出', icon: '📊' },
                  { id: 'complaints', name: '投诉与建议', icon: '📢' },
                  ...(user.isSeller || user.role === 'ADMIN'
                    ? [{
                        id: 'notifications',
                        name: `消息${notifications.filter((n) => !n.read).length ? ` (${notifications.filter((n) => !n.read).length})` : ''}`,
                        icon: '🔔'
                      }]
                    : []),
                  { id: 'refunds', name: '退款', icon: '↩️' }
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">我的订单</h2>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <p className="text-gray-500 text-lg">暂无订单</p>
                      <Link href="/products" className="text-gray-900 hover:underline mt-2 inline-block">
                        去逛逛 →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <Link href={`/orders/${order.id}`} className="block">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="font-semibold text-gray-900">订单号：{order.orderNumber}</p>
                                <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                              </div>
                              {getStatusBadge(order.status)}
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-600">
                                  {order.items?.length > 0
                                    ? `${order.items[0].product.name}${order.items.length > 1 ? ` 等共 ${order.items.length} 件` : ''}`
                                    : '商品信息'}
                                </p>
                              </div>
                              <p className="text-lg font-bold text-gray-900">¥{order.totalAmount.toFixed(2)}</p>
                            </div>
                          </Link>
                          {canRequestRefund(order) && (
                            <div className="mt-4 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setRefundModalOrder(order)
                                  setRefundType('REFUND')
                                  setRefundReason('')
                                }}
                                className="px-4 py-2 bg-white border border-orange-300 text-orange-600 rounded-lg font-semibold text-sm hover:bg-orange-50"
                              >
                                申请退款
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 我的收藏（帖子与评论，不含商品） */}
              {activeTab === 'favorites' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">我的收藏</h2>
                  <p className="text-sm text-gray-600 mb-6">收藏感兴趣的帖子与精彩评论；可进入社区帖子页点击 ☆ 收藏。</p>
                  {favorites.filter((f) => f.type === 'POST' || f.type === 'COMMENT').length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <p className="text-gray-500 text-lg">暂无帖子或评论收藏</p>
                      <Link href="/posts" className="text-gray-900 hover:underline mt-2 inline-block">
                        去社区浏览帖子 →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {favorites
                        .filter((f) => f.type === 'POST' || f.type === 'COMMENT')
                        .map((favorite) => (
                          <div
                            key={favorite.id}
                            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                          >
                            {favorite.type === 'POST' && favorite.post ? (
                              <>
                                <Link href={`/posts/${favorite.post.id}`} className="block p-4 flex-1 hover:bg-gray-50">
                                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">帖子</span>
                                  <h3 className="font-semibold text-gray-900 mt-1 line-clamp-2">{favorite.post.title}</h3>
                                  {favorite.post.author?.username && (
                                    <p className="text-xs text-gray-500 mt-2">作者：{favorite.post.author.username}</p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-2">{formatDate(favorite.createdAt)}</p>
                                </Link>
                              </>
                            ) : favorite.type === 'COMMENT' && favorite.comment ? (
                              <>
                                {(() => {
                                  const c = favorite.comment
                                  const href = c.post?.id
                                    ? `/posts/${c.post.id}#comment-${c.id}`
                                    : c.product?.id
                                      ? `/products/${c.product.id}#comment-${c.id}`
                                      : '/posts'
                                  return (
                                    <Link href={href} className="block p-4 flex-1 hover:bg-gray-50">
                                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">评论</span>
                                      <p className="text-gray-800 mt-2 line-clamp-3 text-sm leading-relaxed">{c.content}</p>
                                      <p className="text-xs text-gray-500 mt-2">
                                        {c.author?.username ? `${c.author.username} · ` : ''}
                                        {c.post?.title ? `帖子：${c.post.title}` : c.product?.name ? `商品：${c.product.name}` : ''}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-2">{formatDate(favorite.createdAt)}</p>
                                    </Link>
                                  )
                                })()}
                              </>
                            ) : (
                              <div className="p-4 text-sm text-gray-500">
                                内容已不可用（{favorite.type}）
                              </div>
                            )}
                            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeFavorite(favorite.id)}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                              >
                                取消收藏
                              </button>
                            </div>
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
                    <h2 className="text-2xl font-bold text-gray-900">我的帖子</h2>
                    <Link href="/posts/new" className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold">
                      ＋ 发帖
                    </Link>
                  </div>
                  {posts.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-lg">暂无帖子</p>
                      <Link href="/posts/new" className="text-gray-900 hover:underline mt-2 inline-block">
                        发布第一条帖子 →
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">我的评论</h2>
                  {comments.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p className="text-gray-500 text-lg">暂无评论</p>
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
                                  帖子：{comment.post.title}
                                </Link>
                              )}
                              {comment.product && (
                                <Link href={`/products/${comment.product.id}`} className="text-gray-900 hover:underline">
                                  商品：{comment.product.name}
                                </Link>
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <span>{formatDate(comment.createdAt)}</span>
                              <button className="text-gray-600 hover:text-gray-800">删除</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 我的商品（卖家） */}
              {activeTab === 'products' && canManageSellerListings && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">我的商品</h2>
                    <Link href="/products/new" className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold">
                      ➕ 上架商品
                    </Link>
                  </div>
                  {sellerProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <p className="text-gray-500 text-lg">暂无商品</p>
                      <Link href="/products/new" className="text-gray-900 hover:underline mt-2 inline-block">
                        创建第一件商品 →
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sellerProducts.map((product) => {
                        const images = safeParseProductImages(product.images)
                        const isAdminRemoved = product.status === 'DELETED'
                        const media = (
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
                        )
                        return (
                          <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                            {isAdminRemoved ? (
                              media
                            ) : (
                              <Link href={`/products/${product.id}`}>{media}</Link>
                            )}
                            <div className="p-4">
                              {isAdminRemoved ? (
                                <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2">
                                  {product.name}
                                </h3>
                              ) : (
                                <Link href={`/products/${product.id}`}>
                                  <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 hover:text-gray-600 transition-colors">
                                    {product.name}
                                  </h3>
                                </Link>
                              )}
                              {isAdminRemoved && (
                                <p className="text-sm text-red-600 mb-2">
                                  该商品已被管理员删除，前台不可见。您可彻底删除以从本列表中移除。
                                </p>
                              )}
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl font-bold text-gray-900">
                                  ¥{product.price.toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  库存：{product.stock}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                                <span>销量：{product.salesCount || 0}</span>
                                <div className="flex items-center">
                                  <span className="text-yellow-400">⭐</span>
                                  <span className="ml-1">{(Number(product.rating) || 0).toFixed(1)}</span>
                                  <span className="ml-2">({Number(product.reviewCount) || 0})</span>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {isAdminRemoved ? (
                                  <button
                                    type="button"
                                    disabled={productDeleteBusyId === product.id}
                                    onClick={() =>
                                      permanentlyRemoveDeletedProduct(product.id)
                                    }
                                    className="flex-1 min-w-[8rem] px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold disabled:opacity-50"
                                  >
                                    {productDeleteBusyId === product.id
                                      ? '删除中…'
                                      : '彻底删除'}
                                  </button>
                                ) : (
                                  <>
                                    <Link
                                      href={`/products/${product.id}/edit`}
                                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold text-center"
                                    >
                                      编辑
                                    </Link>
                                    {product.status === 'ACTIVE' && (
                                      <button
                                        type="button"
                                        disabled={productStatusBusyId === product.id}
                                        onClick={() =>
                                          updateProductListingStatus(
                                            product.id,
                                            'INACTIVE'
                                          )
                                        }
                                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold disabled:opacity-50"
                                      >
                                        {productStatusBusyId === product.id
                                          ? '处理中…'
                                          : '下架'}
                                      </button>
                                    )}
                                    {product.status === 'INACTIVE' && (
                                      <button
                                        type="button"
                                        disabled={productStatusBusyId === product.id}
                                        onClick={() =>
                                          updateProductListingStatus(
                                            product.id,
                                            'ACTIVE'
                                          )
                                        }
                                        className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold disabled:opacity-50"
                                      >
                                        {productStatusBusyId === product.id
                                          ? '处理中…'
                                          : '上架'}
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 收入统计（卖家） */}
              {activeTab === 'incomes' && canManageSellerListings && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">收入</h2>
                  <div className="bg-green-50 rounded-xl p-6 mb-6">
                    <p className="text-sm text-gray-600 mb-1">累计收入</p>
                    <p className="text-3xl font-bold text-green-700">¥{incomes.total?.toFixed(2) || '0.00'}</p>
                  </div>
                  {(!incomes.incomes || incomes.incomes.length === 0) ? (
                    <p className="text-gray-500">暂无收入记录</p>
                  ) : (
                    <div className="space-y-3">
                      {incomes.incomes.map((i: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">¥{i.amount.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">{i.description || '-'}</p>
                          </div>
                          <div className="text-sm text-gray-500">{formatDate(i.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 支出记录 */}
              {activeTab === 'expenses' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">支出</h2>
                  <div className="bg-orange-50 rounded-xl p-6 mb-6">
                    <p className="text-sm text-gray-600 mb-1">累计支出</p>
                    <p className="text-3xl font-bold text-orange-700">¥{expenses.total?.toFixed(2) || '0.00'}</p>
                  </div>
                  {(!expenses.expenses || expenses.expenses.length === 0) ? (
                    <p className="text-gray-500">暂无支出明细</p>
                  ) : (
                    <div className="space-y-3">
                      {expenses.expenses.map((e: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">¥{e.amount.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">{e.description || '-'}</p>
                          </div>
                          <div className="text-sm text-gray-500">{formatDate(e.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 投诉建议 */}
              {activeTab === 'complaints' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">投诉与建议</h2>
                    <button
                      onClick={() => setShowComplaintForm(true)}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold"
                    >
                      ＋ 提交投诉 / 建议
                    </button>
                  </div>
                  {showComplaintForm && (
                    <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-4">提交投诉或建议</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                          <select
                            value={complaintForm.type}
                            onChange={(e) => setComplaintForm({ ...complaintForm, type: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            <option value="COMPLAINT">投诉</option>
                            <option value="SUGGESTION">建议</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                          <input
                            type="text"
                            value={complaintForm.title}
                            onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                            placeholder="请输入标题"
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">内容 *</label>
                          <textarea
                            value={complaintForm.content}
                            onChange={(e) => setComplaintForm({ ...complaintForm, content: e.target.value })}
                            placeholder="请描述问题或建议…"
                            rows={4}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={async () => {
                              if (!complaintForm.title || !complaintForm.content) {
                                alert('请填写标题和内容')
                                return
                              }
                              const token = localStorage.getItem('token')
                              const res = await fetch('/api/complaints', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify(complaintForm)
                              })
                              if (res.ok) {
                                setShowComplaintForm(false)
                                setComplaintForm({ type: 'COMPLAINT', title: '', content: '', orderId: '' })
                                fetchData()
                              } else {
                                const err = await res.json()
                                alert(err.error || '提交失败')
                              }
                            }}
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800"
                          >
                            提交
                          </button>
                          <button
                            onClick={() => setShowComplaintForm(false)}
                            className="px-4 py-2 border rounded-lg"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {complaints.length === 0 ? (
                    <p className="text-gray-500">暂无投诉或建议</p>
                  ) : (
                    <div className="space-y-4">
                      {complaints.map((c) => (
                        <div key={c.id} className="border border-gray-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900">{c.title}</h3>
                            {getStatusBadge(c.status)}
                          </div>
                          <p className="text-gray-600">{c.content}</p>
                          {c.reply && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 mb-1">回复:</p>
                              <p className="text-gray-800">{c.reply}</p>
                            </div>
                          )}
                          <p className="text-sm text-gray-500 mt-2">{formatDate(c.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 处理消息（卖家/管理员） */}
              {activeTab === 'notifications' && (user.isSeller || user.role === 'ADMIN') && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">处理中消息</h2>
                  <p className="text-gray-600 text-sm mb-6">
                    您售出商品的退款申请以及平台代管订单的相关通知会显示在此处。
                  </p>
                  {notifications.length === 0 ? (
                    <p className="text-gray-500">暂无消息</p>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`border rounded-lg p-6 transition-shadow ${n.read ? 'border-gray-200 bg-white' : 'border-orange-200 bg-orange-50/50'}`}
                        >
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <h3 className="font-semibold text-gray-900">{n.title}</h3>
                            {!n.read && (
                              <span className="shrink-0 px-2 py-0.5 text-xs font-semibold bg-orange-200 text-orange-900 rounded">
                                未读
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap text-sm mb-4">{n.body}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-gray-500">{formatDate(n.createdAt)}</span>
                            {n.orderId && (
                              <Link
                                href={user.role === 'ADMIN' ? '/admin/refunds' : `/orders/${n.orderId}`}
                                className="text-gray-900 font-semibold underline hover:no-underline"
                              >
                                {user.role === 'ADMIN' ? '打开退款后台 →' : '查看订单 →'}
                              </Link>
                            )}
                            {!n.read && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const token = localStorage.getItem('token')
                                  if (!token) return
                                  const res = await fetch(`/api/users/notifications/${n.id}`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({ read: true }),
                                  })
                                  if (res.ok) {
                                    setNotifications((prev) =>
                                      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                                    )
                                  }
                                }}
                                className="px-3 py-1 rounded-lg bg-gray-200 text-gray-800 font-medium hover:bg-gray-300"
                              >
                                标为已读
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 退款记录 */}
              {activeTab === 'refunds' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">退款记录</h2>
                  {refunds.length === 0 ? (
                    <p className="text-gray-500">暂无退款记录</p>
                  ) : (
                    <div className="space-y-4">
                      {refunds.map((r) => (
                        <Link key={r.id} href={`/orders/${r.orderId}`}>
                          <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-semibold text-gray-900">{r.order?.orderNumber ? `订单：${r.order.orderNumber}` : '退款申请'}</p>
                              {getStatusBadge(r.status)}
                            </div>
                            <p className="text-gray-600 mb-1">类型：{r.type === 'REFUND' ? '仅退款' : '退货退款'}</p>
                            <p className="text-gray-600 mb-1">原因：{r.reason}</p>
                            <p className="text-gray-900 font-bold">¥{r.amount.toFixed(2)}</p>
                            <p className="text-sm text-gray-500 mt-2">{formatDate(r.createdAt)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {refundModalOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">申请退款</h3>
            <p className="text-sm text-gray-600 mb-4">
              订单 {refundModalOrder.orderNumber} · ¥{refundModalOrder.totalAmount.toFixed(2)}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">退款类型</label>
                <select
                  value={refundType}
                  onChange={(e) => setRefundType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="REFUND">仅退款</option>
                  <option value="RETURN_REFUND">退货退款</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">原因 *</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="请简要说明退款原因…"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setRefundModalOrder(null)
                  setRefundReason('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold"
              >
                取消
              </button>
              <button
                type="button"
                onClick={submitRefundFromDashboard}
                disabled={refunding}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50"
              >
                {refunding ? '提交中…' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
