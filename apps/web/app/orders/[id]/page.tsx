'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    images: string
    seller: { username: string }
  }
}

interface Order {
  id: string
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
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refundType, setRefundType] = useState('REFUND')
  const [refunding, setRefunding] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchOrder()
  }, [params.id, router])

  const fetchOrder = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/orders/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
      } else if (res.status === 404) {
        setOrder(null)
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to fetch order')
      }
    } catch (e) {
      console.error(e)
      alert('Failed to fetch order')
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
          paymentMethod: 'ONLINE',
          paymentNumber: `PAY-${Date.now()}`
        })
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/orders/${order.id}/pay-success?paymentId=${data.payment?.id || ''}`)
      } else {
        const err = await res.json()
        alert(err.error || 'Payment failed')
      }
    } catch (e) {
      alert('Payment failed')
    } finally {
      setPaying(false)
    }
  }

  const handleCancel = async () => {
    if (!order || !confirm('Are you sure you want to cancel this order?')) return
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
        alert(err.error || 'Cancel failed')
      }
    } catch (e) {
      alert('Cancel failed')
    }
  }

  const handleConfirmReceipt = async () => {
    if (!order || !confirm('Confirm receipt?')) return
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
        alert(err.error || 'Operation failed')
      }
    } catch (e) {
      alert('Operation failed')
    }
  }

  const handleRefundSubmit = async () => {
    if (!refundReason.trim()) {
      alert('Please enter refund reason')
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
        alert(err.error || 'Request failed')
      }
    } catch (e) {
      alert('Request failed')
    } finally {
      setRefunding(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

  const getStatusBadge = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
      PENDING_PAYMENT: { text: 'Pending Payment', color: 'bg-yellow-100 text-yellow-800' },
      PAID: { text: 'Paid', color: 'bg-blue-100 text-blue-800' },
      SHIPPED: { text: 'Shipped', color: 'bg-purple-100 text-purple-800' },
      COMPLETED: { text: 'Completed', color: 'bg-green-100 text-green-800' },
      CANCELLED: { text: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
      REFUNDING: { text: 'Refunding', color: 'bg-orange-100 text-orange-800' },
      REFUNDED: { text: 'Refunded', color: 'bg-gray-100 text-gray-800' }
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
          <p className="text-gray-600">Order not found</p>
          <Link href="/dashboard" className="text-gray-900 font-semibold hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
              ← Back to My Orders
            </Link>
            {getStatusBadge(order.status)}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900">Order No.: {order.orderNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">Order Date: {formatDate(order.createdAt)}</p>
            </div>

            <div className="p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Items</h2>
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
                      <p className="text-sm text-gray-500">Seller: {item.product.seller.username}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        ¥{item.price.toFixed(2)} × {item.quantity} = ¥{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-6 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Recipient</span>
                <span>{order.shippingName}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phone</span>
                <span>{order.shippingPhone}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping Address</span>
                <span>{order.shippingAddress}</span>
              </div>
              {order.paidAt && (
                <div className="flex justify-between text-gray-600">
                  <span>Paid At</span>
                  <span>{formatDate(order.paidAt)}</span>
                </div>
              )}
              {order.shippedAt && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipped At</span>
                  <span>{formatDate(order.shippedAt)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-4">
                <span>Total</span>
                <span>¥{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex flex-wrap gap-3">
              {order.status === 'PENDING_PAYMENT' && (
                <>
                  <button
                    onClick={handlePay}
                    disabled={paying}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 disabled:opacity-50"
                  >
                    {paying ? 'Processing...' : 'Pay Now'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                  >
                    Cancel Order
                  </button>
                </>
              )}
              {(order.status === 'SHIPPED' || order.status === 'PAID') && order.status !== 'REFUNDING' && (
                <button
                  onClick={handleConfirmReceipt}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800"
                >
                  Confirm Receipt
                </button>
              )}
              {(order.status === 'SHIPPED' || order.status === 'COMPLETED') && order.status !== 'REFUNDING' && order.status !== 'REFUNDED' && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="px-6 py-2 bg-white border border-orange-300 text-orange-600 rounded-lg font-semibold hover:bg-orange-50"
                >
                  Request Refund
                </button>
              )}
              <Link
                href="/dashboard"
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 inline-block"
              >
                Back to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Request Refund</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Refund Type</label>
                <select
                  value={refundType}
                  onChange={(e) => setRefundType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="REFUND">Refund Only</option>
                  <option value="RETURN_REFUND">Return & Refund</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Please describe the reason for refund..."
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
                Cancel
              </button>
              <button
                onClick={handleRefundSubmit}
                disabled={refunding}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50"
              >
                {refunding ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
