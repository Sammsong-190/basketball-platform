'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import AdminNav from '@/components/AdminNav'

interface Complaint {
  id: string
  type: string
  title: string
  content: string
  status: string
  reply?: string
  repliedAt?: string
  createdAt: string
  user: { username: string }
  order?: { orderNumber: string }
}

export default function AdminComplaintsPage() {
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [newStatus, setNewStatus] = useState('RESOLVED')

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
    fetchComplaints()
  }, [router])

  const fetchComplaints = async () => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/complaints', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setComplaints(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (id: string) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reply, status: newStatus })
      })
      if (res.ok) {
        setEditingId(null)
        setReply('')
        fetchComplaints()
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
      RESOLVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
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
            <h1 className="text-2xl font-bold text-gray-900">Complaints & Suggestions</h1>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Back to Admin
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600"></div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500">
            No complaints or suggestions
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((c) => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">{c.title}</p>
                      <p className="text-sm text-gray-500">User: {c.user.username} · Type: {c.type} · {formatDate(c.createdAt)}</p>
                      {c.order && <p className="text-sm text-gray-500">Order: {c.order.orderNumber}</p>}
                    </div>
                    {getStatusBadge(c.status)}
                  </div>
                  <p className="text-gray-700 mb-4">{c.content}</p>
                  {c.reply && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-gray-600 mb-1">Reply:</p>
                      <p className="text-gray-800">{c.reply}</p>
                      {c.repliedAt && <p className="text-xs text-gray-500 mt-1">{formatDate(c.repliedAt)}</p>}
                    </div>
                  )}
                  {c.status === 'PENDING' && (
                    <div className="pt-4 border-t border-gray-200">
                      {editingId === c.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Reply content"
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="px-3 py-2 border rounded-lg"
                          >
                            <option value="RESOLVED">Resolved</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReply(c.id)}
                              className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
                            >
                              Submit Reply
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setReply('') }}
                              className="px-4 py-2 border rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingId(c.id)}
                          className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800"
                        >
                          Reply
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
