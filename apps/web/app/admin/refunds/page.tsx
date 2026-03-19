'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import AdminNav from '@/components/AdminNav'

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
  order: { orderNumber: string }
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
        alert(err.error || 'Operation failed')
      }
    } catch (e) {
      alert('Operation failed')
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

  const getStatusBadge = (s: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-blue-100 text-blue-800'
    }
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${map[s] || 'bg-gray-100'}`}>{s}</span>
  }

  return (
    <>
      <Header />
      <AdminNav />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Back to Admin
            </Link>
          </div>

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setFilter('')}
              className={`px-4 py-2 rounded-lg font-medium ${!filter ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-4 py-2 rounded-lg font-medium ${filter === 'PENDING' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('APPROVED')}
              className={`px-4 py-2 rounded-lg font-medium ${filter === 'APPROVED' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300'}`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('REJECTED')}
              className={`px-4 py-2 rounded-lg font-medium ${filter === 'REJECTED' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300'}`}
            >
              Rejected
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600"></div>
            </div>
          ) : refunds.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500">
              No refund requests
            </div>
          ) : (
            <div className="space-y-4">
              {refunds.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">Order: {r.order.orderNumber}</p>
                      <p className="text-sm text-gray-500">User: {r.user.username} · {formatDate(r.createdAt)}</p>
                    </div>
                    {getStatusBadge(r.status)}
                  </div>
                  <p className="text-gray-700 mb-2"><span className="font-medium">Type: </span>{r.type === 'REFUND' ? 'Refund Only' : 'Return & Refund'}</p>
                  <p className="text-gray-700 mb-2"><span className="font-medium">Reason: </span>{r.reason}</p>
                  <p className="text-gray-700 mb-4"><span className="font-medium">Amount: </span>¥{r.amount.toFixed(2)}</p>
                  {r.adminNote && <p className="text-sm text-gray-500 mb-4">Note: {r.adminNote}</p>}
                  {r.status === 'PENDING' && (
                    <div className="pt-4 border-t border-gray-200">
                      {editingId === r.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Admin note (optional)"
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(r.id, 'APPROVED')}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApprove(r.id, 'REJECTED')}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setAdminNote('') }}
                              className="px-4 py-2 border rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingId(r.id)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
                        >
                          Process
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
