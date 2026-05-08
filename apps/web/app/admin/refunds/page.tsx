'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import AdminNav from '@/components/AdminNav'
import { adminCanProcessOrderRefund } from '@/lib/refundPermissions'

interface Refund {
  id: string
  orderId: string
  type: string
  reason: string
  amount: number
  status: string
  adminNote?: string
  createdAt: string
  user: { username: string }
  order: {
    orderNumber: string
    items?: Array<{ product?: { sellerId?: string | null; sourceType?: string | null } }>
  }
}

export default function AdminRefundsPage() {
  const router = useRouter()
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/login')
      return
    }
    const user = JSON.parse(userData)
    if (user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchRefunds()
  }, [router, filter])

  const fetchRefunds = async () => {
    const token = localStorage.getItem('token')
    try {
      const url = filter ? `/api/refunds?status=${filter}` : '/api/refunds'
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setRefunds(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string, status: string) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/refunds/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, adminNote: adminNote || undefined })
      })
      if (res.ok) {
        setEditingId(null)
        setAdminNote('')
        fetchRefunds()
      } else {
        const err = await res.json()
        alert([err.error, err.hint].filter(Boolean).join('\n') || '操作失败')
      }
    } catch (e) {
      alert('操作失败')
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

  const refundStatusLabel: Record<string, string> = {
    PENDING: '待处理',
    APPROVED: '已通过',
    REJECTED: '已拒绝',
    COMPLETED: '已完成'
  }

  const getStatusBadge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-blue-100 text-blue-800'
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${map[s] || 'bg-gray-100'}`}>
        {refundStatusLabel[s] || s}
      </span>
    )
  }

  return (
    <>
      <Header />
      <AdminNav />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">退款管理</h1>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              返回管理后台
            </Link>
          </div>

          <div className="mb-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('')}
              className={`px-4 py-2 rounded-lg font-medium ${!filter ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300'}`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-lg font-medium ${filter === 'PENDING' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300'}`}
            >
              待处理
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-4 py-2 rounded-lg font-medium ${filter === 'APPROVED' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300'}`}
            >
              已通过
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-4 py-2 rounded-lg font-medium ${filter === 'REJECTED' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300'}`}
            >
              已拒绝
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600"></div>
            </div>
          ) : refunds.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500">暂无退款申请</div>
          ) : (
            <div className="space-y-4">
              {refunds.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">订单：{r.order.orderNumber}</p>
                      <p className="text-sm text-gray-500">
                        用户：{r.user.username} · {formatDate(r.createdAt)}
                      </p>
                    </div>
                    {getStatusBadge(r.status)}
                  </div>
                  <p className="text-gray-700 mb-2">
                    <span className="font-medium">类型：</span>
                    {r.type === 'REFUND' ? '仅退款' : '退货退款'}
                  </p>
                  <p className="text-gray-700 mb-2">
                    <span className="font-medium">原因：</span>
                    {r.reason}
                  </p>
                  <p className="text-gray-700 mb-4">
                    <span className="font-medium">金额：</span>¥{r.amount.toFixed(2)}
                  </p>
                  {r.adminNote && (
                    <p className="text-sm text-gray-500 mb-4">
                      <span className="font-medium">备注：</span>
                      {r.adminNote}
                    </p>
                  )}
                  {r.status === 'PENDING' &&
                    (adminCanProcessOrderRefund(r.order) ? (
                    <div className="pt-4 border-t border-gray-200">
                      {editingId === r.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="管理员备注（可选）"
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleApprove(r.id, 'APPROVED')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                            >
                              同意
                            </button>
                            <button
                              onClick={() => handleApprove(r.id, 'REJECTED')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                            >
                              拒绝
                            </button>
                            <button
                              onClick={() => {
                                setEditingId(null)
                                setAdminNote('')
                              }}
                              className="px-4 py-2 border rounded-lg"
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingId(r.id)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
                        >
                          处理
                        </button>
                      )}
                    </div>
                    ) : (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                          此单为<span className="font-semibold">单一卖家自由交易</span>
                          ，请由卖家在订单详情或「处理消息」中同意/拒绝退款。管理员不介入此类售后。
                        </p>
                        <Link
                          href={`/orders/${r.orderId}`}
                          className="inline-block mt-2 text-sm font-semibold text-gray-900 underline"
                        >
                          查看订单（可复制链接给卖家）→
                        </Link>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
