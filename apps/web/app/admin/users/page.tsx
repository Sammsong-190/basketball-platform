'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import AdminNav from '@/components/AdminNav'

interface User {
  id: string
  username: string
  email: string
  role: string
  isSeller: boolean
  createdAt: string
  _count: { orders: number; posts: number; products: number }
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')

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
    fetchUsers()
  }, [router, page, roleFilter])

  const fetchUsers = async () => {
    const token = localStorage.getItem('token')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' })
      if (roleFilter) params.set('role', roleFilter)
      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
        setTotal(data.total || 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string, role: string) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: userId, role })
      })
      if (res.ok) fetchUsers()
      else {
        const err = await res.json()
        alert(err.error || 'Update failed')
      }
    } catch (e) {
      alert('Update failed')
    }
  }

  const handleUpdateSeller = async (userId: string, isSeller: boolean) => {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: userId, isSeller })
      })
      if (res.ok) fetchUsers()
      else {
        const err = await res.json()
        alert(err.error || 'Update failed')
      }
    } catch (e) {
      alert('Update failed')
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })

  const totalPages = Math.ceil(total / 10)

  return (
    <>
      <Header />
      <AdminNav />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Back to Admin
            </Link>
          </div>

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setRoleFilter('')}
              className={`px-4 py-2 rounded-lg font-medium ${!roleFilter ? 'bg-gray-900 text-white' : 'bg-white border'}`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter('USER')}
              className={`px-4 py-2 rounded-lg font-medium ${roleFilter === 'USER' ? 'bg-gray-900 text-white' : 'bg-white border'}`}
            >
              Users
            </button>
            <button
              onClick={() => setRoleFilter('ADMIN')}
              className={`px-4 py-2 rounded-lg font-medium ${roleFilter === 'ADMIN' ? 'bg-gray-900 text-white' : 'bg-white border'}`}
            >
              Admins
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Seller</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Orders/Posts/Products</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{u.username}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.isSeller ? <span className="text-green-600">Yes</span> : <span className="text-gray-500">No</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {u._count.orders} / {u._count.posts} / {u._count.products}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        {u.role !== 'ADMIN' && (
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleUpdateRole(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                              className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                            >
                              {u.role === 'ADMIN' ? 'Remove Admin' : 'Set as Admin'}
                            </button>
                            <button
                              onClick={() => handleUpdateSeller(u.id, !u.isSeller)}
                              className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                            >
                              {u.isSeller ? 'Remove Seller' : 'Set as Seller'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 p-4 border-t">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="px-4 py-2">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
