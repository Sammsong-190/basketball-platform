'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import {
  adminCanProcessOrderRefund,
  sellerCanProcessOrderRefund,
} from '@/lib/refundPermissions'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    images: string
    sellerId: string
    sourceType?: string
    seller: { username: string }
  }
}

interface RefundInfo {
  id: string
  status: string
  type: string
  reason: string
  amount: number
  createdAt: string
  user?: { username: string }
}

interface Order {
  id: string
  userId: string
  orderNumber: string
  status: string
  totalAmount: number
  shippingFee: number
  shippingAddress: string
  shippingName: string
  shippingPhone: string
  paymentMethod?: string
  paidAt?: string
  shippedAt?: string
  completedAt?: string
  createdAt: string
  items: OrderItem[]
  refunds?: RefundInfo[]
}

function viewerCanProcessRefund(
  order: Order,
  viewer: { id: string; role: string; isSeller?: boolean }
): boolean {
  if (viewer.role === 'ADMIN') return adminCanProcessOrderRefund(order)
  if (!viewer.isSeller) return false
  return sellerCanProcessOrderRefund(viewer.id, order)
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [accountBalance, setAccountBalance] = useState<number | null>(null)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refundType, setRefundType] = useState('REFUND')
  const [refunding, setRefunding] = useState(false)
  const [viewer, setViewer] = useState<{ id: string; role: string; isSeller?: boolean } | null>(null)
  const [refundProcessNote, setRefundProcessNote] = useState('')
  const [refundProcessing, setRefundProcessing] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    const userRaw = localStorage.getItem('user')
    if (userRaw) {
      try {
        setViewer(JSON.parse(userRaw))
        const u = JSON.parse(userRaw)
        if (typeof u.balance === 'number') setAccountBalance(u.balance)
      } catch {
        setViewer(null)
      }
    }
    fetchOrder()
  }, [params.id, router])

  const syncViewerFromProfile = async (token: string) => {
    try {
      const pr = await fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!pr.ok) return
      const u = await pr.json()
      setViewer({
        id: u.id,
        role: u.role,
        isSeller: u.isSeller === true,
      })
      const raw = localStorage.getItem('user')
      if (raw) {
        const prev = JSON.parse(raw)
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...prev,
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            isSeller: u.isSeller,
            avatar: u.avatar,
            balance: u.balance,
          })
        )
      }
      if (typeof u.balance === 'number') setAccountBalance(u.balance)
    } catch {
      /* ignore */
    }
  }

  const fetchOrder = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
        if (token) {
          await syncViewerFromProfile(token)
        }
      } else if (res.status === 404) {
        setOrder(null)
      } else {
        const err = await res.json()
        alert(err.error || '获取订单失败')
      }
    } catch (e) {
      console.error(e)
      alert('获取订单失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePay = async () => {
    if (!order) return
    setPaying(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/orders/${order.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          paymentMethod: 'BALANCE',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (typeof data.balance === 'number') {
          const raw = localStorage.getItem('user')
          if (raw) {
            const u = JSON.parse(raw)
            localStorage.setItem('user', JSON.stringify({ ...u, balance: data.balance }))
            setAccountBalance(data.balance)
          }
        }
        router.push(`/orders/${order.id}/pay-success?paymentId=${data.payment?.id || ''}`)
      } else {
        const err = await res.json()
        alert(err.error || '支付失败')
      }
    } catch (e) {
      alert('支付失败')
    } finally {
      setPaying(false)
    }
  }

  const handleCancel = async () => {
    if (!order || !confirm('确定要取消该订单吗？')) return
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'CANCELLED' })
      })
      if (res.ok) {
        fetchOrder()
      } else {
        const err = await res.json()
        alert(err.error || '取消失败')
      }
    } catch (e) {
      alert('取消失败')
    }
  }

  const handleConfirmReceipt = async () => {
    if (!order || !confirm('确认已收到货品？')) return
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'COMPLETED' })
      })
      if (res.ok) {
        fetchOrder()
      } else {
        const err = await res.json()
        alert(err.error || '操作失败')
      }
    } catch (e) {
      alert('操作失败')
    }
  }

  const handleRefundSubmit = async () => {
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
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: order?.id,
          type: refundType,
          reason: refundReason,
          amount: order?.totalAmount
        })
      })
      if (res.ok) {
        setShowRefundModal(false)
        setRefundReason('')
        fetchOrder()
      } else {
        const err = await res.json()
        alert(err.error || '请求失败')
      }
    } catch (e) {
      alert('请求失败')
    } finally {
      setRefunding(false)
    }
  }

  const handleRefundProcess = async (refundId: string, status: 'APPROVED' | 'REJECTED') => {
    const label = status === 'APPROVED' ? '同意该退款/退货申请' : '拒绝该申请'
    if (!confirm(`确认要${label}吗？`)) return
    setRefundProcessing(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/refunds/${refundId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          adminNote: refundProcessNote.trim() || undefined
        })
      })
      if (res.ok) {
        setRefundProcessNote('')
        fetchOrder()
      } else {
        const err = await res.json()
        alert([err.error, err.hint].filter(Boolean).join('\n') || '操作失败')
      }
    } catch {
      alert('操作失败')
    } finally {
      setRefundProcessing(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

  const getStatusBadge = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
      PENDING_PAYMENT: { text: '待付款', color: 'bg-yellow-100 text-yellow-800' },
      PAID: { text: '已付款', color: 'bg-blue-100 text-blue-800' },
      SHIPPED: { text: '已发货', color: 'bg-purple-100 text-purple-800' },
      COMPLETED: { text: '已完成', color: 'bg-green-100 text-green-800' },
      CANCELLED: { text: '已取消', color: 'bg-gray-100 text-gray-800' },
      REFUNDING: { text: '退款中', color: 'bg-orange-100 text-orange-800' },
      REFUNDED: { text: '已退款', color: 'bg-gray-100 text-gray-800' }
    }
    const s = map[status] || { text: status, color: 'bg-gray-100 text-gray-800' }
    return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${s.color}`}>{s.text}</span>
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
        </div>
      </>
    )
  }

  if (!order) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-gray-600">未找到订单</p>
          <Link href="/dashboard" className="text-gray-900 font-semibold hover:underline">
            返回个人中心
          </Link>
        </div>
      </>
    )
  }

  const pendingRefund = order.refunds?.find((r) => r.status === 'PENDING')
  const canProcessRefund =
    viewer && order ? viewerCanProcessRefund(order, viewer) : false
  const isBuyer = viewer && order.userId === viewer.id
  const isAdminUser = viewer?.role === 'ADMIN'

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
              {isBuyer ? '← 返回我的订单' : '← 返回个人中心'}
            </Link>
            {getStatusBadge(order.status)}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">订单号：{order.orderNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">下单时间：{formatDate(order.createdAt)}</p>
            </div>

            <div className="p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">商品明细</h2>
              {order.items.map((item) => {
                const imgs = item.product.images ? JSON.parse(item.product.images) : []
                return (
                  <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {imgs[0] ? (
                        <img src={imgs[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">🏀</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product.id}`} className="font-medium text-gray-900 hover:underline line-clamp-2">
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-gray-500">卖家：{item.product.seller.username}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        ¥{item.price.toFixed(2)} × {item.quantity} = ¥{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {pendingRefund && (
              <div className="p-6 border-t border-orange-200 bg-orange-50/90">
                <h2 className="font-semibold text-gray-900 mb-3">退款 / 退货申请</h2>
                <div className="text-sm text-gray-700 space-y-1 mb-3">
                  <p>
                    <span className="font-medium">类型：</span>
                    {pendingRefund.type === 'REFUND' ? '仅退款' : '退货退款'}
                  </p>
                  <p>
                    <span className="font-medium">金额：</span>¥{pendingRefund.amount.toFixed(2)}
                  </p>
                  <p>
                    <span className="font-medium">原因：</span>
                    {pendingRefund.reason}
                  </p>
                  <p className="text-gray-500">
                    申请时间：{formatDate(pendingRefund.createdAt)}
                    {pendingRefund.user?.username && (
                      <span className="ml-2">· 买家 {pendingRefund.user.username}</span>
                    )}
                  </p>
                </div>
                {isBuyer && !canProcessRefund && (
                  <p className="text-sm text-amber-800 bg-amber-100/80 rounded-lg px-3 py-2">
                    {isAdminUser && !adminCanProcessOrderRefund(order)
                      ? '已提交申请，请等待卖家处理（单一卖家自由交易订单不由管理员直接审核）。'
                      : '已提交申请，请等待卖家或平台处理。'}
                  </p>
                )}
                {canProcessRefund && isAdminUser && (
                  <p className="text-xs text-gray-600 mb-2 rounded-lg bg-white/80 border border-orange-100 px-3 py-2">
                    您以管理员身份处理本单（含平台自营或多卖家订单）。也可在后台
                    <Link href="/admin/refunds" className="underline font-semibold text-gray-900 mx-1">
                      退款管理
                    </Link>
                    统一查看所有待处理退款。
                  </p>
                )}
                {canProcessRefund && (
                  <div className="mt-4 space-y-3">
                    <label className="block text-xs font-medium text-gray-600">
                      处理备注（可选）
                    </label>
                    <textarea
                      value={refundProcessNote}
                      onChange={(e) => setRefundProcessNote(e.target.value)}
                      rows={2}
                      placeholder="给买家的说明（同意或拒绝时可填写）"
                      className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm"
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={refundProcessing}
                        onClick={() => handleRefundProcess(pendingRefund.id, 'APPROVED')}
                        className="px-5 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                      >
                        {refundProcessing ? '处理中…' : '确认同意退款 / 退货'}
                      </button>
                      <button
                        type="button"
                        disabled={refundProcessing}
                        onClick={() => handleRefundProcess(pendingRefund.id, 'REJECTED')}
                        className="px-5 py-2.5 bg-white border-2 border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 disabled:opacity-50"
                      >
                        拒绝申请
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      {isAdminUser
                        ? '单一卖家的自由交易退款由卖家处理；含平台自营或多卖家订单时由管理员处理。'
                        : '自由交易订单由卖家处理；含平台自营商品时由管理员处理。'}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="p-6 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>收货人</span>
                <span>{order.shippingName}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>联系电话</span>
                <span>{order.shippingPhone}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>收货地址</span>
                <span>{order.shippingAddress}</span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between text-gray-600">
                  <span>支付时间</span>
                  <span>{formatDate(order.paidAt)}</span>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex justify-between text-gray-600">
                  <span>发货时间</span>
                  <span>{formatDate(order.shippedAt)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-4">
                <span>订单总额</span>
                <span>¥{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex flex-wrap gap-3 flex-col sm:flex-row sm:items-center">
              {order.status === 'PENDING_PAYMENT' && (
                <>
                  {accountBalance !== null && (
                    <p className="w-full text-sm text-gray-600 mb-1 sm:mb-0">
                      使用账户余额支付 · 当前余额{' '}
                      <span className="font-semibold text-gray-900">¥{accountBalance.toFixed(2)}</span>
                      {accountBalance + 1e-9 < order.totalAmount && (
                        <span className="text-red-600 ml-2">（不足支付本单，请先到个人中心充值或调整余额）</span>
                      )}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <button
                    onClick={handlePay}
                    disabled={paying || (accountBalance !== null && accountBalance + 1e-9 < order.totalAmount)}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
                  >
                    {paying ? '处理中…' : '余额支付'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    取消订单
                  </button>
                  </div>
                </>
              )}
              {(order.status === 'SHIPPED' || order.status === 'PAID') && (
                <button
                  onClick={handleConfirmReceipt}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800"
                >
                  确认收货
                </button>
              )}
              {(order.status === 'PAID' ||
                order.status === 'SHIPPED' ||
                order.status === 'COMPLETED') && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="px-6 py-2 bg-white border border-orange-300 text-orange-600 rounded-lg font-semibold hover:bg-orange-50"
                >
                  申请退款
                </button>
              )}
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 inline-block"
              >
                返回订单列表
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">申请退款</h3>
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
                onClick={() => setShowRefundModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold"
              >
                取消
              </button>
              <button
                onClick={handleRefundSubmit}
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
