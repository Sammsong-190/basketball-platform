'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import AdminNav from '@/components/AdminNav'

interface Log {
  id: string
  action: string
  module: string
  description?: string
  level: string
  createdAt: string
  user?: { username: string }
}

export default function AdminLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [levelFilter, setLevelFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')

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
    fetchLogs()
  }, [router, page, levelFilter, moduleFilter])

  const fetchLogs = async () => {
    const token = localStorage.getItem('token')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (levelFilter) params.set('level', levelFilter)
      if (moduleFilter) params.set('module', moduleFilter)
      const res = await fetch(`/api/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
        setTotal(data.total || 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

  const getLevelBadge = (level: string) => {
    const map: Record<string, string> = {
      INFO: 'bg-blue-100 text-blue-800',
      WARN: 'bg-yellow-100 text-yellow-800',
      ERROR: 'bg-red-100 text-red-800'
    }
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[level] || 'bg-gray-100'}`}>{level}</span>
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <>
      <Header />
      <AdminNav />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900">
              Back to Admin
            </Link>
          </div>

          <div className="mb-4 flex gap-2 flex-wrap">
            <button
              onClick={() => setLevelFilter('')}
              className={`px-4 py-2 rounded-lg font-medium ${!levelFilter ? 'bg-gray-900 text-white' : 'bg-white border'}`}
            >
              All Levels
            </button>
            <button
              onClick={() => setLevelFilter('INFO')}
              className={`px-4 py-2 rounded-lg font-medium ${levelFilter === 'INFO' ? 'bg-gray-900 text-white' : 'bg-white border'}`}
            >
              INFO
            </button>
            <button
              onClick={() => setLevelFilter('WARN')}
              className={`px-4 py-2 rounded-lg font-medium ${levelFilter === 'WARN' ? 'bg-gray-900 text-white' : 'bg-white border'}`}
            >
              WARN
            </button>
            <button
              onClick={() => setLevelFilter('ERROR')}
              className={`px-4 py-2 rounded-lg font-medium ${levelFilter === 'ERROR' ? 'bg-gray-900 text-white' : 'bg-white border'}`}
            >
              ERROR
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-500">
            No log entries
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Time</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Level</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Module</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">User</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">{getLevelBadge(log.level)}</td>
                        <td className="px-4 py-3 text-sm font-medium">{log.module}</td>
                        <td className="px-4 py-3 text-sm">{log.action}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{log.user?.username || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{log.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
